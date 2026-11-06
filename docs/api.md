# Collectly API contract

Local base URL: `http://127.0.0.1:8000/api/v1`

The frontend uses `VITE_API_BASE_URL` to select this base URL. Authenticated calls send `Authorization: Bearer <access_token>`. All library endpoints return or modify data owned by the authenticated user.

## Authentication and profile

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account with `email`, `password`, `password_confirmation`, and optional `display_name` |
| POST | `/auth/login` | Accept `{ "email", "password" }`; return `access_token`, `token_type`, and `expires_in` |
| GET | `/users/me` | Return the authenticated profile |
| PATCH | `/users/me` | Update `display_name` |

## Library

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/bookmarks` | Paginated bookmarks; supports `q`, `category_id`, `tag`, `content_type`, `favorite`, `collection_id`, `sort`, `page`, `page_size` |
| POST | `/bookmarks` | Create a bookmark |
| GET | `/bookmarks/{id}` | Get one owned bookmark |
| PATCH | `/bookmarks/{id}` | Update bookmark metadata, tags, category, favorite state, or collections |
| DELETE | `/bookmarks/{id}` | Delete an owned bookmark |
| GET | `/categories` | List the current user's categories |
| POST | `/categories` | Create a category |
| GET | `/collections` | List the current user's collections, including bookmark IDs |
| POST | `/collections` | Create a collection |

Bookmark create/update fields: `url`, `title`, `description`, `thumbnail`, `content_type`, `personal_note`, `is_favorite`, `category_id`, `tag_names`, and `collection_ids`. A category may be omitted to leave a bookmark uncategorized. Tags are created for the current user as needed. URLs are normalized for duplicate detection. List responses contain `items`, `total`, `page`, and `page_size`.

Category create fields are `name`, `color`, and `icon`. Collection create fields are `name`, `description`, `emoji`, and `color`.

## Local development

The Vite development server runs on port `5173`; the API allows both `localhost` and `127.0.0.1` on that port. The frontend can use `frontend/.env.example` as its local API URL template.
