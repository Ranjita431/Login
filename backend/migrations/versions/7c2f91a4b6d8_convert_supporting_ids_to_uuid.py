"""Convert supporting table primary keys to UUIDs while retaining legacy IDs."""
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "7c2f91a4b6d8"
down_revision = "6ab28d9a6cf3"
branch_labels = None
depends_on = None

TABLES = (
    "refresh_tokens",
    "email_verifications",
    "password_resets",
)


def upgrade() -> None:
    connection = op.get_bind()

    for table in TABLES:
        op.add_column(
            table,
            sa.Column("id_uuid", postgresql.UUID(as_uuid=True), nullable=True),
        )

        rows = connection.execute(
            sa.text(f'SELECT id FROM "{table}"')
        ).fetchall()

        for row in rows:
            connection.execute(
                sa.text(f'UPDATE "{table}" SET id_uuid = :new_id WHERE id = :old_id'),
                {"new_id": uuid.uuid4(), "old_id": row.id},
            )

        inspector = sa.inspect(connection)
        pk_name = inspector.get_pk_constraint(table).get("name")
        if pk_name:
            op.drop_constraint(pk_name, table, type_="primary")

        # Preserve the old integer ID and its sequence/default.
        op.alter_column(table, "id", new_column_name="legacy_id")
        op.alter_column(table, "id_uuid", new_column_name="id", nullable=False)
        op.create_primary_key(f"pk_{table}_id", table, ["id"])


def downgrade() -> None:
    for table in reversed(TABLES):
        connection = op.get_bind()
        inspector = sa.inspect(connection)
        pk_name = inspector.get_pk_constraint(table).get("name")
        if pk_name:
            op.drop_constraint(pk_name, table, type_="primary")

        op.drop_column(table, "id")
        op.alter_column(table, "legacy_id", new_column_name="id")
        op.create_primary_key(f"pk_{table}_id", table, ["id"])
