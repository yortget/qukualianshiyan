// 定义一个区块的类，定义我们此项目区块链中的每个区块的数据结构
class Block {
    constructor(index, previousHash, timestamp, data, hash, nonce) {
        this.index = index; // 区块的索引
        this.previousHash = previousHash; // 前一个区块的哈希值
        this.timestamp = timestamp; // 区块的时间戳
        this.data = data; // 区块的数据
        this.hash = hash; // 区块的哈希值
        this.nonce = nonce; // 区块的nonce值
    }

    // 定义一个创世区块
    static get genesis() {
        return new Block(
            0,
            "0",
            1588270000000,
            "Genesis Block",
            "0000dc75a315c77a1f9c98f6247d03dd18ac52632d7dc6a9920261d8109b37cf",
            604,
        );
    }
}

// 导出区块类，让其他文件可以使用
module.exports = Block;