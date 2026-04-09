@echo off
echo [WSF Autofix] Iniciando servidor local...
start "WSF Autofix Server" cmd /k "node wsf-autofix-server.mjs"
timeout /t 2 /nobreak >nul
echo [WSF Autofix] Iniciando ngrok en puerto 4242...
start "ngrok Tunnel" cmd /k "ngrok http 4242"
echo [WSF Autofix] Listo. Copia la URL de ngrok y ponla en Railway como AUTOFIX_TUNNEL_URL
