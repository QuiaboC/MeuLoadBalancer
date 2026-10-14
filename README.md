MeuLoadBalancer

Atividade avaliativa: Escalabilidade de Aplicações Web com Load Balancer.

Aplicação web simples executada em 3 instâncias idênticas, com um balanceador de carga NGINX como único ponto de entrada. Cada instância se identifica na resposta (nome, cor de fundo e cabeçalho HTTP), o que permite comprovar a distribuição das requisições.

[AJUSTAR] Autor(es): Nome 1 (e Nome 2, se for dupla).

1. Tecnologias utilizadas
Camada	Tecnologia
Aplicação	[AJUSTAR] Node.js + Express / Python + Flask / Java + Spring Boot
Balanceador	NGINX (proxy reverso) [AJUSTAR se usou outro]
Orquestração	Docker e Docker Compose
2. Arquitetura
                 ┌──────────┐
                 │ Cliente  │  (navegador / curl)
                 └────┬─────┘
                      │  http://localhost:8080
                 ┌────▼─────┐
                 │  NGINX   │  único ponto de entrada
                 └─┬───┬───┬┘
        ┌──────────┘   │   └──────────┐
   ┌────▼────┐   ┌─────▼───┐   ┌──────▼──┐
   │ app-01  │   │ app-02  │   │ app-03  │   instâncias idênticas
   └─────────┘   └─────────┘   └─────────┘
O usuário acessa somente http://localhost:8080.
O NGINX recebe cada requisição e a repassa a uma das instâncias.
As três instâncias são containers criados da mesma imagem; o que as diferencia é a variável de ambiente INSTANCE_ID.
[AJUSTAR] As instâncias não publicam portas no host; só o NGINX é acessível de fora. (Se as suas publicam portas, como 3001, 3002 e 3003, descreva isso aqui.)
3. Estrutura do repositório

[AJUSTAR] Substitua pela estrutura real (ls -R).

MeuLoadBalancer/
├── docker-compose.yml   # define as 3 instâncias e o NGINX
├── nginx.conf           # configuração do balanceador
└── app/
    ├── Dockerfile       # imagem da aplicação
    └── server.js        # aplicação (rota /, rota /health)
4. Como o balanceamento foi configurado
4.1 Identificação da instância

Cada container recebe um INSTANCE_ID (por exemplo app-01) no docker-compose.yml. A aplicação lê essa variável e a usa em três lugares:

No HTML: bloco em destaque "Respondido por: app-01".
Na cor de fundo: cada instância tem uma cor (app-01 azul, app-02 verde, app-03 laranja). [AJUSTAR]
No cabeçalho HTTP: X-Served-By: app-01.

Nada é fixo no código: subir uma nova instância exige apenas um novo valor de INSTANCE_ID.

4.2 Rotas da aplicação
Rota	Função
/	Página HTML com o indicador visual da instância
/health	Health check: retorna 200 OK quando a instância está saudável
4.3 NGINX

Trecho principal do nginx.conf [AJUSTAR: copie o seu]:

nginx
upstream backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
upstream: define o grupo de servidores de destino.
Política de distribuição: round-robin (padrão do NGINX). As requisições são entregues em ciclo: 1 → 2 → 3 → 1... [AJUSTAR se usou least_conn ou ip_hash]
proxy_pass: repassa a requisição do cliente ao grupo backend.
Tolerância a falhas: [AJUSTAR] Descreva o que o seu projeto faz. Exemplo: o NGINX open source faz verificação passiva: se uma instância falha, ela é marcada como indisponível (max_fails / fail_timeout) e deixa de receber tráfego, e as demais continuam atendendo. A rota /health [AJUSTAR: explique como é usada, por exemplo no healthcheck do Compose].
5. Como executar
Pré-requisitos
Docker Desktop instalado e em execução (aguarde "Engine running").
Git.
Passos
bash
git clone https://github.com/QuiaboC/MeuLoadBalancer.git
cd MeuLoadBalancer
docker compose up -d --build
docker compose ps

Depois acesse: http://localhost:8080 ([AJUSTAR] se a porta for outra).

Para encerrar
bash
docker compose down
6. Como reproduzir os testes de verificação

Os nomes de serviço abaixo (app1, app2, app3) são exemplos. [AJUSTAR] Use os nomes reais (docker compose config --services).

Teste 1: alternância visual

Acesse http://localhost:8080 e recarregue 10 vezes com Ctrl+F5. O nome e a cor de fundo devem mudar a cada requisição.

Teste 2: linha de comando
bash
curl -sI http://localhost:8080 | grep -i x-served-by

Repita o comando. O valor de X-Served-By deve alternar entre as instâncias.

Teste 3: distribuição em volume (100 requisições)
bash
for i in {1..100}; do curl -sI http://localhost:8080 | grep -i x-served-by; done | sort | uniq -c

Resultado esperado: contagem aproximadamente equilibrada (≈ 33 por instância).

Teste 4: tolerância a falhas
bash
docker compose stop app2
# recarregue a página: app-02 não aparece mais e o site continua no ar
docker compose start app2
# app-02 volta a receber requisições
Teste 5: escala (4ª instância)
Adicione o serviço app4 (com INSTANCE_ID=app-04) no docker-compose.yml.
Adicione server app4:3000; no upstream do nginx.conf.
Aplique:
bash
docker compose up -d
docker compose exec nginx nginx -s reload
Repita o Teste 2 ou 3: app-04 passa a aparecer.
Teste 6: evidência nos logs
bash
docker compose logs nginx --tail=30
docker compose logs app1 app2 app3 --tail=10
Prova negativa

[AJUSTAR] Acessar uma instância diretamente (por exemplo http://localhost:3002) mostra que ali o indicador nunca muda, o que evidencia que a alternância vem do balanceador e não da aplicação. (Se as instâncias não publicam portas, informe que elas só são alcançáveis pela rede interna do Docker.)

7. Limitações e observações
Estado em memória: se a aplicação guardasse estado (como sessões) na memória, ele "desapareceria" ao alternar entre instâncias, pois cada uma tem a sua própria memória.
Balanceador como ponto único de falha: se o NGINX cair, o serviço inteiro fica indisponível.
Escala manual: neste projeto, adicionar uma instância exige editar o docker-compose.yml e o nginx.conf e recarregar o NGINX.
8. Possíveis evoluções
Mais instâncias: docker compose up --scale ou novos serviços no Compose.
Sticky sessions: ip_hash no NGINX, para que um mesmo cliente seja atendido sempre pela mesma instância.
Estado externo: Redis ou banco de dados compartilhado entre as instâncias.
Health check ativo: HAProxy, Traefik ou NGINX Plus.
Alta disponibilidade do balanceador: dois balanceadores com IP virtual (keepalived) ou balanceador gerenciado em nuvem (AWS ALB, por exemplo).
Auto scaling: Kubernetes (HPA) ou grupos de Auto Scaling em nuvem.
