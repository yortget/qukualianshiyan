from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent
out = root / "chainscope-terminal-bridge-0.1.4.vsix"
manifest = """<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/visualstudio/2010/ExtensionManifest" xmlns:d="http://schemas.microsoft.com/developer/v1.0">
  <Metadata>
    <Identity Language="en-US" Id="chainscope-terminal-bridge" Version="0.1.4" Publisher="chainscope-local" />
    <DisplayName>ChainScope Terminal Bridge</DisplayName>
    <Description xml:space="preserve">Create the two blockchain CLI terminals from the ChainScope frontend.</Description>
    <Tags>blockchain,terminal</Tags>
    <Categories>Other</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.85.0" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" />
      <Property Id="Microsoft.VisualStudio.Code.EnabledByDefault" Value="true" />
    </Properties>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
  </Assets>
</PackageManifest>
"""
content_types = """<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="js" ContentType="application/javascript" />
  <Default Extension="md" ContentType="text/markdown" />
  <Default Extension="vsixmanifest" ContentType="text/xml" />
</Types>
"""
files = [
    root / "package.json",
    root / "extension.js",
    root / "README.md",
    root / "lib" / "controlServer.js",
]
with ZipFile(out, "w", ZIP_DEFLATED) as archive:
    archive.writestr("extension.vsixmanifest", manifest)
    archive.writestr("[Content_Types].xml", content_types)
    for file in files:
        archive.write(file, f"extension/{file.relative_to(root).as_posix()}")
print(out)
