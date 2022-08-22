import {Response} from 'express';
export class CommonResponse {
    code: number;
    message: string;
    data: any;

    constructor(code: number, message: string, data: any) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    static success(data?: any): CommonResponse {
        return new CommonResponse(ResponseCode.Success, 'success', data);
    }

    static badRequest(msg: string): CommonResponse {
        return new CommonResponse(ResponseCode.BadRequest, msg, null);
    }

    static serverError(msg: string): CommonResponse {
        return new CommonResponse(ResponseCode.ServerError, msg, null);
    }

    static unauthorized(msg: string): CommonResponse {
        return new CommonResponse(ResponseCode.Unauthorized, msg, null);
    }

    static notfound(msg: string): CommonResponse {
        return new CommonResponse(ResponseCode.NotFound, msg, null);
    }

    send(res: Response) {
        res.status(this.code).json(this)
    }
}

export enum ResponseCode {
    ServerError = 500,
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
    Forbidden = 403,
    Success = 200,
}
