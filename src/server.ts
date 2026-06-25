import pc from "picocolors";

import app from "./app.js";

const port = process.env.SERVER_PORT || 3000;
const date = new Date().toISOString();

app.listen(port, () => {
    console.log(
        `${pc.gray(`[${date}]`)} ` +
            pc.green(`Server started at ` + pc.bold(pc.underline(`http://localhost:${port}`)))
    );
});
