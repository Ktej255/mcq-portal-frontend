"""
Unit tests for Mains PDF upload assembler.
Verifies that _assemble_pdf correctly handles multi-page JPEG streams,
generates standard PDF-1.4 structures, and enforces validation boundaries.
"""

import pytest
from fastapi import HTTPException
from app.api.v1.mains_upload import (
    _assemble_pdf,
    _jpeg_dimensions,
    _PDF_HEADER,
)

# Minimal valid 1x1 pixel JPEG byte string
MINIMAL_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00"
    b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19"
    b"\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9="
    b"82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x03\x01\"\x00\x02\x11\x01\x03\x11\x01"
    b"\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00"
    b"\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x0c\x03\x01\x00\x02"
    b"\x11\x03\x11\x00?\x00\xbf\x00\xff\xd9"
)


def test_jpeg_dimensions_parser():
    w, h = _jpeg_dimensions(MINIMAL_JPEG)
    assert w == 1
    assert h == 1


def test_assemble_single_page_pdf():
    pdf_bytes = _assemble_pdf([MINIMAL_JPEG])
    assert pdf_bytes.startswith(_PDF_HEADER)
    assert b"/Type /Catalog" in pdf_bytes
    assert b"/Type /Pages" in pdf_bytes
    assert b"/Count 1" in pdf_bytes
    assert b"%%EOF" in pdf_bytes


def test_assemble_multipage_pdf():
    # 3-page answer
    pages = [MINIMAL_JPEG, MINIMAL_JPEG, MINIMAL_JPEG]
    pdf_bytes = _assemble_pdf(pages)
    assert pdf_bytes.startswith(_PDF_HEADER)
    assert b"/Count 3" in pdf_bytes
    assert b"/Im1" in pdf_bytes
    assert b"/Im2" in pdf_bytes
    assert b"/Im3" in pdf_bytes
    assert b"startxref" in pdf_bytes
    assert b"%%EOF" in pdf_bytes


def test_unreadable_png_is_rejected():
    # A truncated PNG cannot be converted to JPEG, so the upload is refused.
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    with pytest.raises(HTTPException) as exc_info:
        _assemble_pdf([png_bytes])
    assert exc_info.value.status_code == 422
    assert "PNG image could not be read" in exc_info.value.detail
