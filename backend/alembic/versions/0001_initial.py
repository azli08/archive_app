"""Initial migration anchor; domain tables will be added in later revisions.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-04
"""

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Establish the initial migration head."""


def downgrade() -> None:
    """Remove the initial migration head; no tables exist at this revision."""
