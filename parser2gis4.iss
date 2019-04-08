[Setup]

AppName=Parser 2Gis 4
AppVersion="{#AppVersion}"
DefaultDirName={pf}\Parser2Gis4
DefaultGroupName=Parser2Gis4
Compression=none
SolidCompression=yes
OutputDir="Z:\data\projects\parser2gis1\dist"
OutputBaseFilename="parser2gis{#AppVersion}"
PrivilegesRequired=admin

[Files]
Source: "Z:\data\projects\parser2gis1\dist\win-unpacked\*"; DestDir: "{app}"; Flags: recursesubdirs
