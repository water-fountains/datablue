import { Request, Response } from "express";
import buildInfo from "../../common/build.info";

export function buildInfoController(_req: Request, res: Response) {
  return res.json(buildInfo);
}
