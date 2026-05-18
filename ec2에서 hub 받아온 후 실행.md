ssh -i /home/derguil/forum-server/forum-web-server.pem ubuntu@43.203.224.244



1. .env 복사 (로컬 CMD에서)
cmdscp -i C:\Users\jinji\Desktop\forum-web-server.pem .env ubuntu@3.35.140.184:~/
2. docker-compose.yml 복사 (로컬 CMD에서)
cmdscp -i C:\Users\jinji\Desktop\forum-web-server.pem docker-compose.yml ubuntu@3.35.140.184:~/
3. EC2 접속
cmdssh -i C:\Users\jinji\Desktop\forum-web-server.pem ubuntu@3.35.140.184
4. Docker 설치 (EC2에서)
bashsudo apt-get update -y && \
sudo apt-get install docker.io -y && \
sudo service docker start && \
sudo chmod 666 /var/run/docker.sock && \
sudo usermod -a -G docker ubuntu
5. docker compose 설치 (EC2에서)
bashsudo apt-get install docker-compose-v2 -y
6. 실행 (EC2에서)
bashdocker compose up -d