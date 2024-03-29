import { Router } from 'express'
import DataSourceService from '../service/dataSource';

const routes = Router();

routes.get('/dataSource/:id', DataSourceService.getDSById);
routes.get('/dataSource/list/page', DataSourceService.getDataByPage);
routes.route('/dataSource')
    .get(DataSourceService.getList)
    .post(DataSourceService.saveDS)
    .put(DataSourceService.editDS)
    .delete(DataSourceService.delDS);

export default routes;