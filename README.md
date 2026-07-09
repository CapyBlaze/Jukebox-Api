# Jukebox API

A collaborative jukebox API that allows users to create user groups, set up music playlists and stream this music live to any device via a web browser.

- [Swagger Documentation](https://jukebox.capyblaze.hackclub.app/docs)
- [Postman Collection](https://raw.githubusercontent.com/CapyBlaze/Jukebox-Api/refs/heads/main/docs/postman/Jukebox%20API.postman_collection.json)
- [API Endpoint](https://jukebox.capyblaze.hackclub.app/)

## How to use the API

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

## Environment Variables

```env
SERVER_PORT=8085
TRUST_PROXY=true
API_VERSION=v1

DATABASE_URL="file:./dev.db"

ADMIN_USERNAME=admin
ADMIN_PASSWORD=xxxxxxxxxxxxxxxx

YOUTUBE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
```
