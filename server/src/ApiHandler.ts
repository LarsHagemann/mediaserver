import type { RequestHandler } from "express";
import type { ContainerBuilder } from "node-dependency-injection";
import { DI_CONTAINER } from "./DiContainer.js";
import { ApiError } from "./common/ApiError.js";
import type fileUpload from "express-fileupload";
import type { EmptyObject } from "./common/EmptyObject.js";
import { LoggingService } from "./common/LoggingService.js";
import { services } from "./DefaultDiContainer.js";
import * as fs from "fs";
import type { IncomingHttpHeaders } from "http";
import type { Identity } from "./auth/Identity.js";

export class FileDownload {
  constructor(
    public readonly filepath: string,
    public readonly mimeType: string,
  ) { }
}

export class FileStream {
  constructor(
    public readonly filepath: string,
    public readonly mimeType: string,
    public readonly filename: string,
    public readonly startByte: number,
    public readonly endByte: number,
    public readonly totalSize: number,
  ) { }
}

type RangeHeader = {
  start: number;
  end: number;
};

type ApiResult<Response extends object> = {
  status: number;
  body: Response;
};

type ApiFunction<
  Params extends object,
  Response extends object,
  Body extends object,
  Query extends object,
> = (params: {
  diContainer: ContainerBuilder;
  query: Query;
  body: Body;
  params: Params;
  files: fileUpload.FileArray | null | undefined;
  headers: IncomingHttpHeaders;
  identity: Identity;
}) => Promise<ApiResult<Response>>;

export const apiHandler = <
  Response extends object = EmptyObject,
  Query extends object = EmptyObject,
  Body extends object = EmptyObject,
  Params extends object = EmptyObject,
>(
  fn: ApiFunction<Params, Response, Body, Query>,
): RequestHandler<
  Params,
  Response | ApiError,
  Body,
  Query,
  Record<string, unknown>
> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return async (req, res, _next) => {
    DI_CONTAINER.get<LoggingService>(services.logger).debug(
      `${req.method} ${decodeURIComponent(req.url)}`,
    );

    try {
      const result = await fn({
        diContainer: DI_CONTAINER,
        query: req.query,
        body: req.body,
        params: req.params,
        files: req.files,
        headers: req.headers,
        identity: req.identity,
      });
      if (result.body instanceof FileDownload) {
        res
          .header("Content-Type", result.body.mimeType)
          .download(result.body.filepath);
      } else if (result.body instanceof FileStream) {
        res
          .header("Content-Type", result.body.mimeType)
          .header("Content-Disposition", `inline; filename="${result.body.filename}"`)
          .header("Content-Range", `bytes ${result.body.startByte}-${result.body.endByte}/${result.body.totalSize}`)
          .header("Content-Length", (result.body.endByte - result.body.startByte + 1).toString())
          .header("Accept-Ranges", "bytes");

        const videoStream = fs.createReadStream(
          result.body.filepath,
          { start: result.body.startByte, end: result.body.endByte }
        );

        res.status(206);

        videoStream.pipe(res);
      } else {
        res.status(result.status).json(result.body);
      }
    } catch (error) {
      DI_CONTAINER.get<LoggingService>(services.logger).error(
        "Error occurred while processing API request",
        error,
      );
      if (error instanceof ApiError) {
        res.status(error.status).json(error);
      } else {
        res.status(500).json({
          status: 500,
          message: "Internal Server Error",
          name: "InternalServerError",
        });
      }
    }
  };
};

const CHUNK_SIZE = 10 * 1024 * 1024;
export const parseRangeHeader = (rangeHeader: string, fileSize: number): RangeHeader | undefined => {
  const rangeMatch = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!rangeMatch) {
    return undefined;
  }

  const startString = rangeMatch[1]!;
  const endString = rangeMatch[2]!;

  let start: number;
  let end: number;

  if (startString === "" && endString === "") {
    return undefined;
  }

  if (startString === "") {
    // suffix byte range
    const suffixLength = parseInt(endString, 10);
    if (isNaN(suffixLength)) {
      return undefined;
    }
    start = fileSize - suffixLength;
    end = fileSize - 1;
  } else {
    start = parseInt(startString, 10);
    if (isNaN(start) || start < 0) {
      return undefined;
    }

    if (endString === "") {
      end = fileSize - 1;
    } else {
      end = parseInt(endString, 10);
      if (isNaN(end) || end < start) {
        return undefined;
      }
    }
  }

  if (start >= fileSize) {
    return undefined;
  }

  if (end >= fileSize) {
    end = fileSize - 1;
  }

  if (end - start + 1 > CHUNK_SIZE) {
    end = start + CHUNK_SIZE - 1;
  }

  return { start, end };
};
