require('dotenv').config();
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const chalk = require('chalk');
const { connectDB } = require('./db');
const { createServer } = require('./server');
const { restoreAllSessions } = require('./sessionManager');

(async () => {
    try {
        await connectDB();

        const app = createServer();
        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(chalk.green(`✅ DARKX-MD panel running on port ${PORT}`));
            console.log(chalk.cyan(`   • Pair a number:   /pair`));
            console.log(chalk.cyan(`   • Admin panel:     /admin/login`));
            console.log(chalk.cyan(`   • User settings:   /user/login`));
        });

        await restoreAllSessions();
    } catch (err) {
        console.error(chalk.red('Fatal startup error:'), err);
        process.exit(1);
    }
})();
