const minimist = require("minimist");
const execa = require("execa");

const args = minimist(process.argv.slice(2));

const target = args.length? args._[0] : 'runtime-dom';

const formarts = args.f || "global";

const sourceMap = args.s || false;

//这个是传递环境变量 输出到进程里 nodejs环境
execa("rollup",[
    '-wc',//--watch --config
    '--environment',
    [
        `TARGET:${target}`,
        `FORMATS:${formarts}`,
        sourceMap? `SOURCE_MAP:true`:''

    ].filter(Boolean).join(",")],
    {
        stdio:'inherit',//这个子进程的输入是在我们当前命令行中输出的
    }
    )

// console.log(args,target,formarts,sourceMap,process.argv,"dev.js")