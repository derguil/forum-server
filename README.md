# 📋 forum-server

에브리타임 커뮤니티(클론코딩) 서비스를 위한 백엔드 서버입니다. 게시판/게시글/댓글 같은 기본 커뮤니티 기능은 물론, 실시간 채팅과 인기글 랭킹 배치까지 포함한 프로덕션 레벨의 백엔드를 목표로 설계했습니다.

## 🌐 시스템 아키텍처

```
                        ┌────────────┐
                        │   Client   │
                        └─────┬──────┘
                              │
                        ┌─────▼──────┐
                        │   Nginx    │  (Load Balancer)
                        └─────┬──────┘
              ┌───────────────┼───────────────┐
        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
        │  app-1    │   │  app-2    │   │  app-3    │   NestJS (REST + WebSocket)
        └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
              └───────────────┼───────────────┘
                        ┌─────▼──────┐
                        │   Redis    │  (Socket.IO Adapter Pub/Sub)
                        └─────┬──────┘
                        ┌─────▼──────┐        ┌────────────┐
                        │   MySQL    │        │  AWS S3    │ (이미지 저장)
                        └────────────┘        └────────────┘

        ┌────────────┐   ┌────────────┐   ┌────────────┐
        │  Promtail  │──▶│    Loki    │──▶│  Grafana   │  (로그 수집/모니터링)
        └────────────┘   └────────────┘   └────────────┘
```

NestJS 앱 3개를 Docker Compose로 띄우고 Nginx가 앞단에서 로드밸런싱합니다. Socket.IO 이벤트는 Redis Adapter(pub/sub)로 인스턴스 간 동기화합니다. 모든 컨테이너 로그는 Promtail이 수집해 Loki에 저장하고, Grafana 대시보드로 시각화합니다.

## ⚙️ 기술 스택

| 분류 | 기술 스택 |
|---|---|
| 언어 | TypeScript |
| 프레임워크 | NestJS 11 |
| 데이터 접근 | Prisma ORM |
| 실시간 통신 | Socket.IO (WebSocket Gateway), Redis Adapter |
| 인증/인가 | JWT (Access/Refresh Token), Passport |
| 파일 저장 | AWS S3 |
| 데이터베이스 | MySQL 8.4 |
| 로깅 | Winston (JSON 구조화 로그) |
| 배치/스케줄링 | @nestjs/schedule (Cron) |
| 컨테이너 환경 | Docker, Docker Compose |
| 배포 | Docker Hub → EC2 Pull 방식 |
| 로드밸런싱 | Nginx |
| 모니터링 | Loki, Promtail, Grafana |

## ✨ 주요 기능

### 🔐 인증 및 사용자 관리
- 회원가입/로그인: username·email 기반, bcrypt 비밀번호 해싱
- JWT 기반 인증: Access Token + Refresh Token 발급 및 재발급(`/auth/refresh`)
- Refresh Token 보안: DB에 평문 저장 대신 bcrypt 해시로 저장 후 검증
- 로그아웃: Refresh Token 무효화 처리
- 내 정보 관리: 닉네임/이메일/비밀번호 변경, 프로필 이미지 업로드(S3)

### 📝 포럼 및 게시글
- 포럼(게시판) 생성 및 목록/단건 조회
- 게시글 CRUD, Soft Delete 지원(삭제 이력 보존)
- 게시글 추천(1일 1회 제한 - `PostVote` 유니크 제약으로 처리)
- 게시글 스크랩(북마크) 등록/해제
- 게시글 이미지 첨부(S3 업로드 연동)

### 💬 댓글
- 댓글 작성/삭제 (Soft Delete)
- 게시글별 댓글 수 실시간 카운트 캐싱

### 🏆 랭킹
- TREND / HOT / BEST 3종 랭킹 제공
- 매시간 자동 실행되는 Cron 배치로 최근 1시간 활동 기반 TREND 랭킹 재계산

### 💬 실시간 채팅
- Socket.IO 기반 채팅방 입장/퇴장, 메시지 송수신
- 안읽은 메시지 카운트, 마지막 메시지 미리보기
- 메시지 읽음 처리 실시간 동기화

### 🛠️ 인프라/운영
- 요청 단위 구조화 로깅(Winston) → Loki/Grafana 대시보드 연동
- Docker Compose 기반 다중 인스턴스 배포 및 Nginx 로드밸런싱
- Prisma Migration으로 스키마 버전 관리

## 📁 프로젝트 구조

```
forum-server/
├── src/
│   ├── main.ts                    # 애플리케이션 진입점 (Winston 로거, 글로벌 파이프/필터 설정)
│   ├── app.module.ts               # 루트 모듈
│   ├── auth/                       # 회원가입/로그인/JWT 발급·재발급/로그아웃
│   ├── forums/                     # 포럼(게시판) 생성/조회
│   ├── posts/                      # 게시글 CRUD, 추천, 스크랩, 이미지
│   │   └── rankings/                # TREND/HOT/BEST 랭킹 + 매시간 Cron 배치
│   ├── comments/                   # 댓글 작성/삭제
│   ├── me/                         # 내 정보/내 활동(게시글·댓글·스크랩) 조회
│   ├── chat/                       # 채팅방 REST API(생성/목록/메시지 조회)
│   ├── events/gateways/            # Socket.IO 채팅 Gateway (실시간 송수신)
│   ├── infra/
│   │   ├── prisma/                  # Prisma 클라이언트 모듈
│   │   └── s3client/                 # AWS S3 업로드 모듈
│   ├── logger/                     # Winston 로깅 미들웨어/모듈
│   └── common/                     # 전역 Guard, Pipe, Exception Filter, Decorator
├── prisma/
│   ├── schema.prisma                # DB 스키마 (User, Forum, Post, Comment, Chat 등)
│   └── migrations/                  # 마이그레이션 이력
├── nginx/                          # Nginx 리버스 프록시/로드밸런서 설정
├── docker-compose.yml               # MySQL + App×3 + Nginx + Loki/Promtail/Grafana
├── Dockerfile
├── loki-config.yml / promtail-config.yml / grafana-datasources.yml  # 모니터링 스택 설정
└── test/                           # e2e 테스트
```

## 📡 API 개요

| 도메인 | 엔드포인트 |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` `GET /auth/me` |
| Forums | `POST /forums` `GET /forums` `GET /forums/:forumId` |
| Posts | `POST /posts` `GET /posts` `GET /posts/:postId` `PATCH /posts/:postId` `DELETE /posts/:postId` `POST/DELETE /posts/:postId/postvote` `POST/DELETE /posts/:postId/scrap` |
| Rankings | `GET /posts/rankings` |
| Comments | `POST /comments` `DELETE /comments/:commentId` |
| Me | `GET /me` `PATCH /me/username` `PATCH /me/email` `PATCH /me/password` `PUT /me/profile-image` `GET /me/posts` `GET /me/comments` `GET /me/scraps` |
| Chat | `POST /chat/rooms` `GET /chat/rooms` `GET /chat/rooms/:roomId/messages` (+ WebSocket 실시간 이벤트) |

## 🗄️ ERD

