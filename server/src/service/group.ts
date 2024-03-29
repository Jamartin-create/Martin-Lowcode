import { Request, Response, NextFunction } from 'express';
import { ErrCode, exceptionOnSave } from '../common/exception';
import { getUserInfo } from '../utils/auth';
import { GroupSchema } from '../db/mongoDB/schema/business';
import { useModel } from '../db/mongoDB/index';
import { guid } from '../utils/strHandler';
import { initSchemaInfo, updateSchemaInfo } from '../utils/dataFilled';
import { ItemModel } from './items';

export const groupModel = useModel('group', GroupSchema);

export async function getGROUP_BYID(id: string) {
    try {
        const group = await groupModel.findOne({ groupId: id });
        return group;
    } catch (e) {
        throw e;
    }
}
export function saveGroup(group: any) {
    return new Promise(async (resolve, reject) => {
        try {
            const ret = await new groupModel(group).save();
            resolve(ret);
        } catch (e) {
            reject(e);
        }
    });
}

export default class GroupService {
    //根据项目id获取组件组
    static getGroupByItemId = async (req: Request, res: Response, next: NextFunction) => {
        const { query: { itemId } } = req;
        if (!itemId) return next(ErrCode.PARAM_EXCEPTION);
        try {
            const item = await ItemModel.findOne({ "itemId": itemId });
            if (!item) return next(ErrCode.ITEM_NOT_FOUND_EXCEPTION);
            const group = await getGROUP_BYID(item.groupId);
            if (!group) return next(ErrCode.GROUP_NOT_FOUD_EXCEPTION);
            res.send({ code: 0, msg: 'success', data: group });
        } catch (e) {
            console.error(e);
            next(ErrCode.SELECT_MG_EXCEPTION);
        }
    }
    //根据id获取组件组
    static getGroupById = async (req: Request, res: Response, next: NextFunction) => {
        const { query: { groupId } } = req;
        if (!groupId) return next(ErrCode.PARAM_EXCEPTION);
        try {
            const data = await getGROUP_BYID(groupId as string);
            res.send({ code: 0, msg: 'success', data });
        } catch (e) {
            console.error(e);
            next(ErrCode.EXCEUTE_EXCEPTION);
        }
    }
    //保存组件组
    static saveOne = (req: Request, res: Response, next: NextFunction) => {
        const { body: { groupTitle, groupJson } } = req;
        if (!groupTitle || !groupJson) return next(ErrCode.PARAM_EXCEPTION);
        const user = getUserInfo(req);
        const groupOption = {
            groupTitle,
            groupJson,
            groupId: guid(),
            ...initSchemaInfo(user.userId)
        }
        exceptionOnSave(new groupModel(groupOption), res, next, (options: any) => {
            res.send({ ...options, data: groupOption });
        });
    }
    //编辑组件组
    static editOne = async (req: Request, res: Response, next: NextFunction) => {
        const { body: { groupTitle, groupJson, groupId } } = req;
        if (!groupId) return next(ErrCode.PARAM_EXCEPTION);
        const groups = await groupModel.find({ 'groupId': groupId });
        if (groups.length == 0) return next(ErrCode.GROUP_NOT_FOUD_EXCEPTION);
        const group = groups[0];
        if (group.groupTitle == groupTitle && group.groupJson == groupJson) {
            res.send({ code: 0, msg: 'success' });
            return;
        }
        const user = getUserInfo(req);
        try {
            await groupModel.updateOne({ groupId }, {
                groupTitle: groupTitle || group.groupTitle,
                groupJson: groupJson || group.groupJson,
                ...updateSchemaInfo(user.userId)
            });
            res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.error(e.message);
            next(ErrCode.SELECT_MG_EXCEPTION);
        }
    }
}