# Firestore-ready model

Firebase is optional in this phase and no Firebase Admin SDK or credentials are included. The model is designed for a future client/web SDK or a separately authorized Firestore repository.

Canonical documents use stable IDs: `titles/{titleId}`, with nested `seasons/{seasonId}` and `episodes/{episodeId}`. Supporting top-level collections are `aliases`, `artwork`, `people`, `credits`, `genres`, `tags`, `releases`, `audioTracks`, `subtitles`, `providers`, `providerItems`, `playbackSources`, `sourceHealth`, `provenance`, `relationships`, `syncState`, `adminOverrides`, and `auditLogs`.

Provider records remain separate from canonical records. `providerItems` stores provider ID, external ID, canonical title ID, and provenance. Audio/subtitle/release data never changes canonical title identity. Playback resolves by provider plus source ID, then applies license, availability, health, expiry, quality, language, and priority rules.

Recommended Firestore indexes cover canonical title normalized values, aliases, provider/external ID pairs, title/year/media type, episode title IDs, and playback source episode/availability/health fields.
