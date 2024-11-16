import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const AdminId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest()

        return request.adminId
    }
)

export const id = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest()

        return request.id
    }
)

export const role = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest()

        return request.role
    }
)