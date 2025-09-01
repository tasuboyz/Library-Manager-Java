# Script PowerShell per eseguire i test JUnit 5 senza Gradle
# Scarica junit-platform-console-standalone e lancia i test presenti in out/test-classes

param(
    [string]$JarUrl = 'https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.10.0/junit-platform-console-standalone-1.10.0.jar'
)

New-Item -ItemType Directory -Force -Path .\libs > $null
$jar = '.\libs\junit-platform-console-standalone-1.10.0.jar'
if (-not (Test-Path $jar)) {
    Write-Host "Downloading junit-platform-console-standalone..."
    Invoke-WebRequest $JarUrl -OutFile $jar
}

# Compile tests and main sources
New-Item -ItemType Directory -Force -Path .\out > $null
$src = Get-ChildItem -Path .\src\main\java -Recurse -Filter *.java | ForEach-Object { $_.FullName }
$tests = Get-ChildItem -Path .\src\test\java -Recurse -Filter *.java | ForEach-Object { $_.FullName }

javac -d .\out $src $tests

# Run tests
java -jar $jar -cp .\out --scan-class-path
