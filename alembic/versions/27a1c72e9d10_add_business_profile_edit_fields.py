"""Persist postal code, accent color and audience age groups."""
from alembic import op
import sqlalchemy as sa
revision = "27a1c72e9d10"
down_revision = "f16ff42ae755"
branch_labels = None
depends_on = None


def upgrade():
    for table, column in (
        ("business_profiles", sa.Column("pincode", sa.String(32), nullable=True)),
        ("brand_profiles", sa.Column("accent_color", sa.String(32), nullable=True)),
        ("target_audiences", sa.Column("age_groups", sa.JSON(), nullable=True)),
    ):
        existing = {item["name"] for item in sa.inspect(op.get_bind()).get_columns(table)}
        if column.name not in existing:
            op.add_column(table, column)
    op.execute(sa.text("UPDATE target_audiences SET age_groups = '[]' WHERE age_groups IS NULL"))


def downgrade():
    op.drop_column("target_audiences", "age_groups")
    op.drop_column("brand_profiles", "accent_color")
    op.drop_column("business_profiles", "pincode")
