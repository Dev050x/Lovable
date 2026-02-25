import { defaultBuildLogger, Template, waitForURL } from 'e2b'
import "dotenv/config";

async function main() {
    const template = Template()
        .fromNodeImage('21-slim')
        .setWorkdir('/home/user/nextjs-app')
        .runCmd('npx create-next-app@14.2.30 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir')
        .runCmd('npx shadcn@latest init -d -y')
        .runCmd(`npx shadcn@latest add -y --overwrite \
  accordion alert alert-dialog aspect-ratio avatar badge \
  breadcrumb button calendar card carousel checkbox \
  collapsible command context-menu dialog drawer dropdown-menu \
  form hover-card input input-otp label menubar navigation-menu \
  pagination popover progress radio-group resizable scroll-area \
  select separator sheet skeleton slider sonner switch table \
  tabs textarea toast toggle toggle-group tooltip`)
        .runCmd('mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app')
        .setWorkdir('/home/user')
        .setStartCmd('npx next --turbo', waitForURL('http://localhost:3000'));


    Template.build(template, 'nextjs-app-shadcn', {
        cpuCount: 4,
        memoryMB: 4096,
        onBuildLogs: defaultBuildLogger(),
    })

}

main().catch((err) => {
    console.error('Error:', err);
});