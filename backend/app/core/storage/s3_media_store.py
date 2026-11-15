"""S3-style MediaStore implementation (prod) — R11.2, R17.4.

Implements the same :class:`MediaStore` protocol as the local store using an
S3-compatible backend (Supabase Storage, AWS S3, MinIO, etc.). References are server-authored and
reads are authorized to the Owning_Student / Evaluator; objects are returned as
bytes through the application — never via a public URL.

``boto3`` is imported lazily so importing this module never requires the SDK or
credentials in environments that use the local/in-memory store.

Supabase Storage (the production store) speaks the S3 protocol. Set:

* ``MEDIA_STORE_BACKEND=s3``
* ``MEDIA_STORE_S3_BUCKET`` – a *private* Supabase Storage bucket
* ``MEDIA_STORE_S3_ENDPOINT_URL`` – ``https://<project-ref>.storage.supabase.co/storage/v1/s3``
* ``MEDIA_STORE_S3_REGION`` – the project's region, e.g. ``ap-south-1``
* ``MEDIA_STORE_S3_ACCESS_KEY_ID`` / ``MEDIA_STORE_S3_SECRET_ACCESS_KEY`` – an
  S3 access key from Supabase (Storage > S3 Connection)

Without an endpoint URL the store talks to AWS S3 using the standard AWS
credential chain, which keeps older deployments working.
"""
from __future__ import annotations

import os

from app.core.storage.media_store import (
    MediaRef,
    MediaStoreError,
    _authorize,
    _mint_key,
)


class S3MediaStore:
    """Stores answer-sheet images in an S3-compatible bucket."""

    def __init__(self, bucket: str | None = None, *, region: str | None = None) -> None:
        self.bucket = bucket or os.environ.get("MEDIA_STORE_S3_BUCKET")
        if not self.bucket:
            raise MediaStoreError(
                "S3MediaStore requires a bucket (set MEDIA_STORE_S3_BUCKET)"
            )
        self.region = (
            region
            or os.environ.get("MEDIA_STORE_S3_REGION")
            or os.environ.get("AWS_REGION")
            or "ap-south-1"
        )
        self.endpoint_url = os.environ.get("MEDIA_STORE_S3_ENDPOINT_URL") or None
        self._access_key_id = os.environ.get("MEDIA_STORE_S3_ACCESS_KEY_ID") or None
        self._secret_access_key = os.environ.get("MEDIA_STORE_S3_SECRET_ACCESS_KEY") or None
        if bool(self._access_key_id) != bool(self._secret_access_key):
            raise MediaStoreError(
                "Set both MEDIA_STORE_S3_ACCESS_KEY_ID and MEDIA_STORE_S3_SECRET_ACCESS_KEY, or neither"
            )
        self._client = None

    def _s3(self):
        if self._client is None:
            try:
                import boto3  # lazy import
            except Exception as exc:  # pragma: no cover - env dependent
                raise MediaStoreError(
                    "boto3 is required for S3MediaStore but is not installed"
                ) from exc
            kwargs = {"region_name": self.region}
            if self.endpoint_url:
                kwargs["endpoint_url"] = self.endpoint_url
            if self._access_key_id:
                kwargs["aws_access_key_id"] = self._access_key_id
                kwargs["aws_secret_access_key"] = self._secret_access_key
            if self.endpoint_url:
                # Supabase Storage needs path-style addressing.
                from botocore.config import Config

                kwargs["config"] = Config(s3={"addressing_style": "path"})
            self._client = boto3.client("s3", **kwargs)
        return self._client

    def put(
        self,
        data: bytes,
        *,
        content_type: str,
        owner_id: int,
        attempt_id: int,
        page_order: int,
    ) -> MediaRef:
        key = _mint_key(owner_id, attempt_id, page_order)
        try:
            self._s3().put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type or "application/octet-stream",
            )
        except Exception as exc:  # pragma: no cover - network dependent
            raise MediaStoreError(f"failed to store object: {type(exc).__name__}") from exc
        return MediaRef(key=key)

    def open(
        self,
        key: str,
        *,
        requester_id: int,
        is_evaluator: bool,
        owner_id: int,
    ) -> bytes:
        _authorize(requester_id, owner_id, is_evaluator)
        try:
            obj = self._s3().get_object(Bucket=self.bucket, Key=key)
            return obj["Body"].read()
        except Exception as exc:  # pragma: no cover - network dependent
            raise MediaStoreError(f"object not found or unreadable: {key}") from exc


__all__ = ["S3MediaStore"]
