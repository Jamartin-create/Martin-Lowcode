import { Request, ResType } from '../utils/request';

const v1 = '/api/v1';
type PromiseRes = Promise<ResType>;

//字典分类接口
export interface DictType {
    sgtId: string;
    sgtName: string;
    sgtCode: string;
}
//字典入口接口
export interface DictEntry {
    sgeId: string;
    sgtId: string;
    sgeName: string;
    sgeCode: string;
    sgeValue: string;
}

export default class DictApi {
    //新增字典Type
    static saveDictType(params: Partial<DictType>): PromiseRes {
        return Request.post(`${v1}/dict/type`, params);
    }
    //查询字典Type
    static getDictType(params?: Pick<DictType, 'sgtCode' | 'sgtId'>): PromiseRes {
        let qs = '';
        if (params) {
            qs += '?' + (params.sgtCode ? `sgtCode=${params.sgtCode}` : '') + (params.sgtId ? `sgtId=${params.sgtId}` : '')
        }
        return Request.get(`${v1}/dict/type${qs}`);
    }
    //新增字典Entry
    static saveDictEntry(params: Partial<DictEntry>): PromiseRes {
        return Request.post(`${v1}/dict/entry`, params);
    }
    //批量新增字典Entry
    static saveBatchDictEntry(params: Array<Partial<DictEntry>>): PromiseRes {
        return Request.post(`${v1}/dict/entry/saveBatch`, params);
    }
    //根据字典Type的ID查询字典Entry
    static getDictEntry(sgtId: string): PromiseRes {
        return Request.get(`${v1}/dict/entry?sgtId=${sgtId}`);
    }
    //根据字典Type的Code查询字典Entry
    static getDictEntryByCode(sgtCode: string): PromiseRes {
        return Request.get(`${v1}/dict/entry?sgtCode=${sgtCode}`);
    }
}