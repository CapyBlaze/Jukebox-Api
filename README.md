<h1 align="center">Jukebox API</h1>

<a id="readme-top"></a>

<p align="center">
    <img src="https://img.shields.io/github/license/CapyBlaze/Jukebox-Api?style=flat-square" alt="LICENSE"/>
    <img src="https://img.shields.io/github/package-json/version/CapyBlaze/Jukebox-Api?style=flat-square" alt="VERSION"/>
    <img src="https://img.shields.io/github/last-commit/CapyBlaze/Jukebox-Api?style=flat-square" alt="LAST COMMIT"/>
    <img src="https://img.shields.io/github/issues/CapyBlaze/Jukebox-Api?style=flat-square" alt="ISSUES"/>
    <img src="https://img.shields.io/github/stars/CapyBlaze/Jukebox-Api?style=flat-square" alt="STARS"/>
    </br>
    <img src="https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white" alt="NODE"/>
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TYPESCRIPT"/>
    <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="PRISMA"/>
    <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLITE"/>
    <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="SWAGGER"/>
    <img src="https://img.shields.io/badge/Express.js-Framework-989898?style=flat-square&logo=express&logoColor=white" alt="EXPRESS"/>
</p>

A collaborative jukebox API where groups of users queue up songs, vote for or against a song, and stream the playlist live to any device.
Designed to run on a local network, making it perfect for a Raspberry Pi or a small home server.

<div>
    <h4>
        <b>📖 Swagger Documentation:</b>
        <a href="https://jukebox.capyblaze.hackclub.app/docs" target="_blank">
            https://jukebox.capyblaze.hackclub.app/docs
        </a>
    </h4>
    <h4>
        <b>📬 Postman Collection:</b>
        <a href="./docs/postman/Jukebox API.postman_collection.json" target="_blank">
            docs/postman/Jukebox API.postman_collection.json
        </a>
    </h4>
    <h4>
        <b>🌐 API Endpoint:</b>
        <code>https://jukebox.capyblaze.hackclub.app/</code>
    </h4>
    <br>
    <details>
        <summary>🗂️ Table of Contents</summary>
        <ol>
            <li>
                <a href="#🔎-features">🔎 Features</a>
            </li>
            <li>
                <a href="#❓-how-it-works">❓ How it works</a>
            </li>
            <li>
                <a href="#🛸-how-to-use-the-api">🛸 How to use the API</a>
            </li>
            <li>
                <a href="#🚀-getting-started">🚀 Getting Started</a>
            </li>
            <li>
                <a href="#⚙️-environment-variables">⚙️ Environment Variables</a>
            </li>
            <li>
                <a href="#🛠️-architecture-and-tech-stack">🛠️ Architecture and Tech Stack</a>
            </li>
            <li>
                <a href="#🤝-contributing">🤝 Contributing</a>
            </li>
            <li>
                <a href="#📝-license">📝 License</a>
            </li>
            <li>
                <a href="#👤-author">👤 Author</a>
            </li>
        </ol>
    </details>

</div>

---

## 🔎 Features

- Token-based authentication
- Group creation and management
- Collaborative music queue
- YouTube search integration
- Voting system
- Live audio streaming via stream tokens
- Administration panel
- REST API
- OpenAPI / Swagger documentation

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ❓ How it works

Each session is organized around a group, created and joined using a unique code.

Users can:

- Create or join a group with a pseudo
- Search for songs on YouTube
- Add songs to the shared queue
- Vote for or against a song
- Stream the live playlist using a stream token
- Manage playback as the group admin (play, pause, skip)

The app is fully server-side and the queue, votes, and playback state are managed by the API.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🛸 How to use the API

### 1. Create or Join a Group

Create a new group:

```http
POST /group/create
```

The API returns a group code and an admin token:

```json
{
    "code": "X7K2QP",
    "maxUsers": 20,
    "adminToken": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Other users can then join the group using its code and a pseudo:

```http
POST /group/{groupId}/join
{
  "pseudo": "string"
}
```

The API returns a unique token:

```json
{
    "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

Store this token carefully. It identifies you within the group and will be required for all future requests.

Use it in the `Authorization` header:

```http
Authorization: Bearer
```

### 2. Search for a song

Search YouTube for a song to add to the queue:

```http
GET /search?q=string
```

### 3. Add a Song to the Queue

```http
POST /group/queue
{
    "title": "string",
    "provider": "youtube",
    "providerKey": "string",
}
```

View the current queue:

```http
GET /group/queue
```

### 4. Control Playback

As the group admin, you can control playback:

```http
POST /group/queue/play
POST /group/queue/pause
POST /group/queue/skip
```

Check what's currently playing:

```http
GET /group/queue/current
```

### 5. Vote for a Song

You can start a vote via:

```http
POST /group/vote/create
{
  "title": "string",
  "url": "string",
  "timeoutSec": 180
}
```

Other members can then cast their vote:

```http
POST /group/vote/{voteId}/vote
{
    "isUpvote": true
}
```

### 6. Stream the Jukebox

Retrieve the group's stream token:

```http
GET /group/jukebox/token
```

Use it to access the live audio player, no authentication required:

```http
GET /jukebox/{streamToken}
```

If the stream token is ever compromised, the admin can rotate it:

```http
PATCH /group/jukebox/token/rotate
```

### 7. Other Routes

To see the rest of the available routes, please refer to the [documentation](https://jukebox.capyblaze.hackclub.app/docs/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>
  
## 🚀 Getting Started

### Prerequisites

- Node.js (v24 or higher)
- npm, yarn or pnpm

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/CapyBlaze/Jukebox-Api.git
    cd Jukebox-Api
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open your browser and navigate to `http://localhost:8080`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SERVER_PORT=8085
TRUST_PROXY=true
API_VERSION=v1

DATABASE_URL="file:./dev.db"

ADMIN_USERNAME=admin
ADMIN_PASSWORD=xxxxxxxxxxxxxxxx

YOUTUBE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🛠️ Architecture and Tech Stack

### Architecture

- **Config** : [src/config](src/config) - contains configuration files for the application.
- **Controllers** : [src/controllers](src/controllers) - Handle incoming requests and return responses.
- **Services** : [src/services](src/services) - Contain business logic and interact with the database.
- **Middlewares** : [src/middlewares](src/middlewares) - Handle request processing, authentication, and error handling.
- **Scheduler** : [src/scheduler](src/scheduler) - Contains scheduled tasks for background processing.

### Tech Stack

- **Express** - Web framework
- **TypeScript** - Programming language
- **Prisma** - Database ORM
- **SQLite** - Database
- **Swagger** - API documentation

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## 👤 Author

### Code

- GitHub: [@CapyBlaze](https://github.com/CapyBlaze)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

Made with ❤️ by [Capy Blaze](https://github.com/CapyBlaze)
