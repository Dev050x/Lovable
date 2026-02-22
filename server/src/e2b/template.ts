import { defaultBuildLogger, Template, waitForURL } from 'e2b'
import "dotenv/config"; 

async function main() {
    const template = Template()
        .fromNodeImage('21-slim')
        .setWorkdir('/home/user/nextjs-app')
        .runCmd(
            'npx create-next-app@14.2.30 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir'
        )
        .runCmd(
            'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app'
        )
        .setWorkdir('/home/user')
        .setStartCmd('npx next --turbo', waitForURL('http://localhost:3000'));


    Template.build(template, 'nextjs-app', {
        cpuCount: 4,
        memoryMB: 4096,
        onBuildLogs: defaultBuildLogger(),
    })

}

main().catch((err) => {
    console.error('Error:', err);
});