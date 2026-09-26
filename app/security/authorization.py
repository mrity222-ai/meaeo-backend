from app.security.tenant import TenantContext


class TenantAuthorizationService:

    @staticmethod
    def require_access(
        context: TenantContext,
        resource_tenant_id: str,
    ) -> None:

        if (
            context.tenant_id
            != resource_tenant_id
        ):
            raise PermissionError(
                "Tenant does not have access "
                "to this resource."
            )