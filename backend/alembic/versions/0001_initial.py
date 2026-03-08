"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE userrole AS ENUM ('admin', 'member');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE booktype AS ENUM ('ebook', 'physical');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE notetype AS ENUM ('text', 'voice');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE ocrstatus AS ENUM ('uploaded', 'processing', 'completed', 'failed');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    user_role = postgresql.ENUM("admin", "member", name="userrole", create_type=False)
    book_type = postgresql.ENUM("ebook", "physical", name="booktype", create_type=False)
    note_type = postgresql.ENUM("text", "voice", name="notetype", create_type=False)
    ocr_status = postgresql.ENUM(
        "uploaded",
        "processing",
        "completed",
        "failed",
        name="ocrstatus",
        create_type=False,
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "books",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("type", book_type, nullable=False),
        sa.Column("category", sa.String(length=255), nullable=True),
        sa.Column("language", sa.String(length=64), nullable=True),
        sa.Column("format", sa.String(length=16), nullable=True),
        sa.Column("shelf", sa.String(length=100), nullable=True),
        sa.Column("progress_percent", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_books_owner_id"), "books", ["owner_id"], unique=False)

    op.create_table(
        "book_files",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("book_id", sa.String(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=1024), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("book_id"),
    )
    op.create_index(op.f("ix_book_files_book_id"), "book_files", ["book_id"], unique=True)

    op.create_table(
        "notes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("book_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("type", note_type, nullable=False),
        sa.Column("page_anchor", sa.String(length=255), nullable=True),
        sa.Column("section_anchor", sa.String(length=255), nullable=True),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("audio_path", sa.String(length=1024), nullable=True),
        sa.Column("duration_sec", sa.Integer(), nullable=True),
        sa.Column("is_private", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notes_book_id"), "notes", ["book_id"], unique=False)
    op.create_index(op.f("ix_notes_user_id"), "notes", ["user_id"], unique=False)

    op.create_table(
        "snapshots",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("book_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("image_path", sa.String(length=1024), nullable=False),
        sa.Column("page_ref", sa.String(length=255), nullable=True),
        sa.Column("ocr_status", ocr_status, nullable=False),
        sa.Column("ocr_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_snapshots_book_id"), "snapshots", ["book_id"], unique=False)
    op.create_index(op.f("ix_snapshots_user_id"), "snapshots", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_snapshots_user_id"), table_name="snapshots")
    op.drop_index(op.f("ix_snapshots_book_id"), table_name="snapshots")
    op.drop_table("snapshots")

    op.drop_index(op.f("ix_notes_user_id"), table_name="notes")
    op.drop_index(op.f("ix_notes_book_id"), table_name="notes")
    op.drop_table("notes")

    op.drop_index(op.f("ix_book_files_book_id"), table_name="book_files")
    op.drop_table("book_files")

    op.drop_index(op.f("ix_books_owner_id"), table_name="books")
    op.drop_table("books")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS ocrstatus")
    op.execute("DROP TYPE IF EXISTS notetype")
    op.execute("DROP TYPE IF EXISTS booktype")
    op.execute("DROP TYPE IF EXISTS userrole")
