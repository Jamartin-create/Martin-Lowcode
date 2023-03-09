import { Request, Response, NextFunction } from 'express';
import { ErrCode } from '../common/exception';
import { getUserInfo } from '../utils/auth';
import { GroupSchema } from '../db/mongoDB/schema/business';
import { useModel } from '../db/mongoDB/index';
import { guid } from '../utils/strHandler';
import { initSchemaInfo, updateSchemaInfo } from '../utils/dataFilled';

const groupModel = useModel('group', GroupSchema);

export default class GroupService {
    //保存组件组
    static saveOne = (req: Request, res: Response, next: NextFunction) => {
        const { body: { groupTitle, groupJson } } = req;
        if (!groupTitle || !groupJson) return next(ErrCode.PARAM_EXCEPTION);
        const user = getUserInfo(req);
        new groupModel({
            groupTitle,
            groupJson,
            groupId: guid(),
            ...initSchemaInfo(user.userId)
        }).save(err => {
            if (err) {
                console.error(err);
                next(ErrCode.SELECT_MG_EXCEPTION);
                return;
            }
            res.send({ code: 0, msg: 'success' });
        })
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
                groupTitle,
                groupJson,
                ...updateSchemaInfo(user.userId)
            });
            res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.error(e.message);
            next(ErrCode.SELECT_MG_EXCEPTION);
        }
    }
}