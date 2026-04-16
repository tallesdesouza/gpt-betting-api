PASSO A PASSO MINIMO

1) Baixe e extraia este ZIP.

2) Abra a pasta gpt-betting-api no VS Code.

3) No terminal, dentro da pasta, rode:
   npm install -g vercel

4) Faça login na Vercel:
   vercel login

5) Publique:
   vercel

6) Depois da publicação, copie a URL gerada.

7) Abra o arquivo openapi.yaml e troque:
   https://SEU-PROJETO.vercel.app
   pela sua URL real da Vercel.

8) No criador do seu GPT > Actions:
   - Autenticação: Nenhum
   - Esquema: cole o conteúdo inteiro do openapi.yaml

9) Teste no navegador:
   https://SUA-URL.vercel.app/api/health
   https://SUA-URL.vercel.app/api/match-overview?home_team=Flamengo&away_team=Palmeiras&competition=Brasileirao
   https://SUA-URL.vercel.app/api/odds?home_team=Flamengo&away_team=Palmeiras

OBSERVACAO
- Esta primeira versão já deixa a Action funcional.
- Os dados ainda estão mockados.
- Depois nós trocamos por dados reais de estatísticas e odds.
