import jwt
from fastapi import HTTPException, status
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def verify_token(id_token: str) -> dict:
    """Verify a Clerk JWT and map claims to the local user identity shape."""
    try:
        # Unverified decoding is restricted to explicitly local/test runtimes.
        # The dependency layer has the same guard; keeping it here prevents
        # direct callers from weakening production or staging verification.
        local_mock_environment = settings.APP_ENVIRONMENT in {"development", "test", "local"}
        if not settings.CLERK_JWT_KEY and settings.ALLOW_MOCK_AUTH and local_mock_environment:
            logger.warning("CLERK | CLERK_JWT_KEY is not set. Decoding token WITHOUT signature verification for local testing.")
            decoded_token = jwt.decode(id_token, options={"verify_signature": False})
        else:
            if not settings.CLERK_JWT_KEY:
                raise ValueError("CLERK_JWT_KEY env variable is required for signature verification.")

            # Ensure correct PEM formatting
            public_key = settings.CLERK_JWT_KEY.strip()
            if not public_key.startswith("-----BEGIN PUBLIC KEY-----"):
                formatted_key = public_key.replace(" ", "\n")
                if "\n" not in formatted_key:
                    formatted_key = "\n".join(public_key[i:i+64] for i in range(0, len(public_key), 64))
                public_key = f"-----BEGIN PUBLIC KEY-----\n{formatted_key}\n-----END PUBLIC KEY-----"

            decoded_token = jwt.decode(
                id_token,
                public_key,
                algorithms=["RS256"],
                options={"verify_exp": True}
            )

        # Preserve the legacy uid alias while exposing Clerk's canonical subject.
        sub = decoded_token.get("sub")
        if not isinstance(sub, str) or not sub.strip():
            raise ValueError("Token subject is required")
        sub = sub.strip()
        mapped_token = {
            "sub": sub,
            "uid": sub,
            "email": decoded_token.get("email") or decoded_token.get("email_address") or f"{sub}@clerk.local",
            "name": decoded_token.get("name") or decoded_token.get("first_name", "") or sub,
            "picture": decoded_token.get("picture") or decoded_token.get("image_url")
        }
        return mapped_token
    except Exception:
        logger.warning("Clerk token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
