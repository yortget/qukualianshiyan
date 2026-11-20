import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  fetchBlocks,
  fetchNodeInfo,
  fetchPeers,
  portFromApiBase,
  resolveNodeApis,
} from '../api/nodeClient'
import { formatTimeOfDay } from '../utils/format'

const AUTO_REFRESH_INTERVAL = 2000
const configuredApis = resolveNodeApis()
const configuredPorts = configuredApis.map(portFromApiBase).filter(Boolean)
const NO_NODES_MESSAGE = `未发现可用节点。请先在 blockchaindemo 中执行 npm run start，再执行 open <P2P 端口>${
  configuredPorts.length ? `（前端正在探测 ${configuredPorts.join(' / ')}）` : ''
}。`

function compareNodes(a, b) {
  return (a.p2pPort ?? Number.POSITIVE_INFINITY) - (b.p2pPort ?? Number.POSITIVE_INFINITY) ||
    (a.apiPort ?? 0) - (b.apiPort ?? 0)
}

export function useNodeNetwork() {
  const nodes = ref([])
  const currentNode = ref(null)
  const blocks = ref([])
  const peers = ref([])

  const connectionState = ref('connecting')
  const errorMessage = ref('')
  const lastUpdatedAt = ref(null)

  const isLoadingNodes = ref(false)
  const isRefreshingChain = ref(false)
  const isBootstrapping = ref(true)
  const autoRefresh = ref(true)

  let autoTimer = null
  let pollInFlight = false
  let chainRequestId = 0

  const currentApi = computed(() => currentNode.value?.apiBase ?? null)
  const lastUpdatedLabel = computed(() =>
    lastUpdatedAt.value ? formatTimeOfDay(lastUpdatedAt.value) : '—',
  )

  async function probeNodes() {
    const settled = await Promise.allSettled(
      configuredApis.map(async (apiBase) => {
        const info = await fetchNodeInfo(apiBase)
        const p2pPort = Number(info?.p2pPort)

        return {
          apiBase,
          apiPort: Number(info?.apiPort) || portFromApiBase(apiBase),
          p2pPort: Number.isFinite(p2pPort) && p2pPort > 0 ? p2pPort : null,
          blockCount: Number(info?.blockCount) || 0,
        }
      }),
    )

    return settled
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
      .sort(compareNodes)
  }

  function applyNodes(discovered) {
    const previous = currentNode.value
    const previousBase = previous?.apiBase ?? null
    const reachable = discovered.map((node) => ({ ...node, reachable: true }))

    // 首次加载：按 P2P 端口展示，但默认选中配置里的第一个可达 API。
    if (!previousBase) {
      if (!reachable.length) {
        nodes.value = []
        currentNode.value = null
        connectionState.value = 'disconnected'
        errorMessage.value = NO_NODES_MESSAGE
        return false
      }

      const preferred =
        reachable.find((node) => node.apiBase === configuredApis[0]) ?? reachable[0]
      nodes.value = reachable
      currentNode.value = preferred
      blocks.value = []
      peers.value = []
      connectionState.value = 'connecting'
      errorMessage.value = ''
      return true
    }

    const matched = reachable.find((node) => node.apiBase === previousBase)

    if (matched) {
      nodes.value = reachable
      currentNode.value = matched
      return false
    }

    // 轮询时当前节点偶尔不可达，不要静默切换到另一个节点，否则页面会在
    // 用户不知情时展示另一条链。保留当前选择并标记为暂不可达，等它恢复。
    const staleNode = { ...previous, reachable: false }
    nodes.value = [staleNode, ...reachable]
    currentNode.value = staleNode
    connectionState.value = 'disconnected'
    errorMessage.value = `${previousBase}：节点暂时不可达，展示最后一次同步的数据。`
    return false
  }

  async function loadChain(node, { silent = false } = {}) {
    const requestId = ++chainRequestId

    if (!silent) {
      isRefreshingChain.value = true
      connectionState.value = 'connecting'
    }

    try {
      const [chain, peerList] = await Promise.all([
        fetchBlocks(node.apiBase),
        fetchPeers(node.apiBase).catch(() => []),
      ])

      if (requestId !== chainRequestId || currentNode.value?.apiBase !== node.apiBase) return

      blocks.value = Array.isArray(chain) ? chain : []
      peers.value = Array.isArray(peerList) ? peerList : []
      node.blockCount = blocks.value.length

      connectionState.value = 'connected'
      errorMessage.value = ''
      lastUpdatedAt.value = Date.now()
    } catch (error) {
      if (requestId !== chainRequestId || currentNode.value?.apiBase !== node.apiBase) return

      connectionState.value = 'disconnected'
      errorMessage.value = `${node.apiBase}：${error?.message || '请求失败'}`
    } finally {
      if (!silent && requestId === chainRequestId) {
        isRefreshingChain.value = false
      }
    }
  }

  async function refreshNodes() {
    if (isLoadingNodes.value) return

    isLoadingNodes.value = true
    try {
      const discovered = await probeNodes()
      applyNodes(discovered)

      if (currentNode.value && currentNode.value.reachable !== false) {
        await loadChain(currentNode.value)
      }
    } finally {
      isLoadingNodes.value = false
    }
  }

  async function refreshChain() {
    if (isRefreshingChain.value) return

    if (!currentNode.value) {
      await refreshNodes()
      return
    }

    await loadChain(currentNode.value)
  }

  async function selectNode(node) {
    if (!node || node.apiBase === currentNode.value?.apiBase) return

    currentNode.value = node
    blocks.value = []
    peers.value = []
    errorMessage.value = ''

    await loadChain(node)
  }

  async function poll() {
    if (typeof document !== 'undefined' && document.hidden) return
    if (pollInFlight || isLoadingNodes.value || isRefreshingChain.value) return

    pollInFlight = true
    try {
      const discovered = await probeNodes()
      applyNodes(discovered)

      if (currentNode.value && currentNode.value.reachable !== false) {
        await loadChain(currentNode.value, { silent: true })
      }
    } finally {
      pollInFlight = false
    }
  }

  function stopAutoRefresh() {
    if (autoTimer !== null) {
      window.clearInterval(autoTimer)
      autoTimer = null
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh()
    if (!autoRefresh.value) return
    autoTimer = window.setInterval(poll, AUTO_REFRESH_INTERVAL)
  }

  watch(autoRefresh, (enabled) => {
    if (enabled && !isBootstrapping.value) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  })

  function handleVisibilityChange() {
    if (!document.hidden && autoRefresh.value && !isBootstrapping.value) {
      poll()
    }
  }

  onMounted(async () => {
    document.addEventListener('visibilitychange', handleVisibilityChange)

    try {
      await refreshNodes()
    } finally {
      isBootstrapping.value = false
      startAutoRefresh()
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    stopAutoRefresh()
  })

  return {
    nodes,
    currentNode,
    currentApi,
    blocks,
    peers,
    connectionState,
    errorMessage,
    lastUpdatedAt,
    lastUpdatedLabel,
    isLoadingNodes,
    isRefreshingChain,
    isBootstrapping,
    autoRefresh,
    refreshNodes,
    refreshChain,
    selectNode,
  }
}
