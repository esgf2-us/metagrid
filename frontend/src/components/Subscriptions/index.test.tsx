import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';

it('renders error message when projects can"t be fetched', () => {
    server.use(
        rest.get(apiRoutes.userSubscriptions.path, (_req, res, ctx) => {
            return res(ctx.status(404));
        })
    );
});
