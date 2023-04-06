import { NextFunction, Request, Response } from 'express'
import { initModel } from '../db/mysql'
import { deviceModelOptions, dataModelOptions, valueModelOptions } from '../db/mysql/model/models'
import { guid } from '../utils/strHandler';
import { ErrCode } from '../common/exception';
import { Op } from 'sequelize';

const deviceModel = initModel('device', deviceModelOptions);
const dataModel = initModel('data', dataModelOptions);
const valueModel = initModel('value', valueModelOptions);



/**
 * + SDDD(same device，diff datasource)：设备中不同数据源（饼状图、条形图）
 * + SDSDT(same device，same datasource, By time)：同类设备检测的相同数据字段（按时间分类：折线图）
 * + SDSDD(same device, same datasource, By device)：同类设备检测的相同数据字段（按设备分类：条形图、饼状图）
 * + ODOD(one device, one datasource)：单一设备中的单一数据（普通数据展示图、按时间划分则为折线图）
 */

//单一字段折线图查询
export async function getLineChartData(dev_id: string, data_code: string, start_time?: string, end_time?: string, next?: NextFunction) {
    const data: any = await dataModel.findOne({ where: { data_code: data_code, dev_id: dev_id } });
    if (!data) return next(ErrCode.MQ_DATA_NOT_FOUND);
    const wheres: any[] = [{ data_id: data.id }];
    if (start_time && end_time) {
        wheres.push({ create_time: { $between: [start_time, end_time] } });
    }
    const value = await valueModel.findAll({ order: [['create_time', 'ASC']], where: { [Op.and]: wheres } });
    return {
        device: dev_id,
        data_label: data.data_label,
        list: value.map((v: any) => {
            const timestamp = new Date(v.create_time);
            return {
                time: `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}`,
                value: v.val_value
            }
        })
    };
}

//多设备单一字段折线图查询
export function getMultiLineChartSql(dev_ids: string[], data_code: string, start_time?: string, end_time?: string) {
    let sql = `select dev_id, create_time, data_value from value where dev_id in (${dev_ids.map(id => `'${id}'`).join(',')}) and data_code = '${data_code}'`;
    if (start_time && end_time) {
        sql += ` and create_time between '${start_time}' and '${end_time}'`;
    }
    return sql;
}

function getDataByCategory(categoryBy: string, dev_id: string, data_code: string, start_time?: string, end_time?: string, next?: NextFunction) {
    switch (categoryBy) {
        case 'SDDD':
            return `select data_code, data_name, count(*) as count from value where dev_id = '${dev_id}' group by data_code`;
        case 'SDSDT':
            return `select data_code, data_name, create_time, data_value from value where dev_id = '${dev_id}' and data_code = '${data_code}' and create_time between '${start_time}' and '${end_time}'`;
        case 'SDSDD':
            return `select dev_id, dev_name, data_code, data_name, data_value from value where dev_id = '${dev_id}' and data_code = '${data_code}'`;
        case 'ODOD':
            return getLineChartData(dev_id, data_code, start_time, end_time, next);
        default:
            return '';
    }
}

export default class MysqlApiService {

    //统计查询
    static async getStatistics(req: Request, res: Response, next: NextFunction) {
        const { categoryBy, dev_id, data_code, start_time, end_time } = req.body;
        if (!categoryBy || !dev_id || !data_code) return next(ErrCode.PARAM_EXCEPTION);
        try {
            const data = await getDataByCategory(categoryBy, dev_id, data_code, start_time, end_time, next);
            console.log(data);
            return res.send({ code: 0, msg: 'success', data });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //新增设备
    static async saveDevice(req: Request, res: Response, next: NextFunction) {
        const { dev_code, dev_name, dev_type } = req.body;
        if (!dev_code || !dev_name || !dev_type) return next(ErrCode.PARAM_EXCEPTION);
        const id = guid();
        try {
            await deviceModel.create({
                dev_code,
                dev_name,
                dev_type,
                id,
            });
            return res.send({ code: 0, msg: 'success', data: id });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //删除设备
    static async deleteDevice(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        if (!id) return next(ErrCode.PARAM_EXCEPTION);
        try {
            await deviceModel.destroy({ where: { id } });
            return res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //编辑设备
    static async editDevice(req: Request, res: Response, next: NextFunction) {
        const { id, dev_code, dev_name, dev_type } = req.body;
        if (!id || (!dev_code && !dev_name && !dev_type)) return next(ErrCode.PARAM_EXCEPTION);
        try {
            const newOptions: {
                dev_code?: string,
                dev_name?: string,
                dev_type?: string
            } = {}
            dev_code && (newOptions['dev_code'] = dev_code)
            dev_name && (newOptions['dev_name'] = dev_name)
            dev_type && (newOptions['dev_type'] = dev_type)
            await deviceModel.update(newOptions, { where: { id } });
            return res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }


    //新增数据
    static async saveData(req: Request, res: Response, next: NextFunction) {
        const { data_code, data_label, data_name, dev_id } = req.body;
        if (!data_code || !data_label || !data_name || !dev_id) return next(ErrCode.PARAM_EXCEPTION);
        const id = guid();
        try {
            await dataModel.create({
                data_code,
                data_label,
                data_name,
                dev_id,
                id,
            });
            return res.send({ code: 0, msg: 'success', data: id });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //删除数据
    static async deleteData(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        if (!id) return next(ErrCode.PARAM_EXCEPTION);
        try {
            await dataModel.destroy({ where: { id } });
            return res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //编辑数据
    static async editData(req: Request, res: Response, next: NextFunction) {
        const { id, data_code, data_label, data_name, dev_id } = req.body;
        if (!id || (!data_code && !data_label && !data_name && !dev_id)) return next(ErrCode.PARAM_EXCEPTION);
        try {
            const newOptions: {
                data_code?: string,
                data_label?: string,
                data_name?: string,
                dev_id?: string
            } = {}
            data_code && (newOptions['data_code'] = data_code)
            data_label && (newOptions['data_label'] = data_label)
            data_name && (newOptions['data_name'] = data_name)
            dev_id && (newOptions['dev_id'] = dev_id)

            await dataModel.update(newOptions, { where: { id } });
            return res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //新增值
    static async saveValue(req: Request, res: Response, next: NextFunction) {
        const { val_value, create_time, data_id } = req.body;
        if (!val_value || !create_time || !data_id) return next(ErrCode.PARAM_EXCEPTION);
        const id = guid();
        try {
            await valueModel.create({
                val_value,
                create_time,
                data_id,
                id,
            });
            return res.send({ code: 0, msg: 'success', data: id });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

    //删除值
    static async deleteValue(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        if (!id) return next(ErrCode.PARAM_EXCEPTION);
        try {
            await valueModel.destroy({ where: { id } });
            return res.send({ code: 0, msg: 'success' });
        } catch (e) {
            console.log(e);
            return next(ErrCode.SELECT_MQ_EXCEPTION);
        }
    }

}