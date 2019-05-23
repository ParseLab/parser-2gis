#define MyAppName "Parser 2Gis 4"

[Setup]

AppName="{#MyAppName}"
AppId={{9A452D88-9CC1-493A-AA46-8B33FFD4A641}}
AppVersion="{#AppVersion}"
DefaultDirName={userpf}\Parser2Gis4
DefaultGroupName=Parser2Gis4
Compression=zip/9
SolidCompression=yes
OutputDir="Z:\media\vitaly\Data\projects\parser2gis1\dist"
OutputBaseFilename="parser2gis{#AppVersion}"
PrivilegesRequired=lowest

[Files]
Source: "Z:\media\vitaly\Data\projects\parser2gis1\dist\win-ia32-unpacked\*"; DestDir: "{app}"; Excludes: "\dist\*,\node_modules\*"; Flags: recursesubdirs

[Run]
Filename: {app}\parser2gis4.exe; Flags: nowait postinstall skipifsilent

[Icons]
Name: "{commonprograms}\ParseLab\{#MyAppName}"; Filename: "{app}\parser2gis4.exe"; IconFilename: "{app}\parser2gis4.exe"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\parser2gis4.exe"; IconFilename: "{app}\parser2gis4.exe"