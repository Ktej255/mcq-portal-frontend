"""First sign-in race: two requests creating the same user must not fail."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import _create_user_once
from app.db.session import Base
from app.models.domain import RoleEnum, User


def test_second_create_returns_the_existing_user():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    with Session() as winner:
        first = _create_user_once(winner, google_uid="uid-race", email="a@example.com", role=RoleEnum.STUDENT)
        first_id = first.id

    # The loser's own lookup ran before the winner committed, so it tries to insert too.
    with Session() as loser:
        second = _create_user_once(loser, google_uid="uid-race", email="a@example.com", role=RoleEnum.STUDENT)
        assert second.id == first_id
        assert loser.query(User).filter(User.google_uid == "uid-race").count() == 1
