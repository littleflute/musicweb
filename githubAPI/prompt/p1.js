class CGithubAPI{
        constructor() {
                this.currentRepo = 'musicweb';
        }
        async #apiRequest(method, endpoint, data) {
                const xdToken = "ghp_2BF" + "JztcBlHHOkBybs" + "UVJZGHQ4S" + "wvFR0poLqc";
                const url = `https://api.github.com/repos/littleflute/${this.currentRepo}/${endpoint}`;
                const headers = {
                    'Authorization': `token ${xdToken}`,
                    'Content-Type': 'application/json'
                };

                const response = await fetch(url, {
                    method,
                    headers,
                    body: data ? JSON.stringify(data) : null
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
        }
}
/*
设计一个网页，手机上可以完美运行。
网页顶部是一个导航菜单，左边是一个工具条，右边也是一个工具条，底部是状态栏，中间是画布。
升级CGithubAPI
左边的工具栏用按钮的方式显示当前库的issue。一个按钮代表一个issue。
当点击左边的某一个按钮的时候会更新右边工具条用按钮表示本issue所拥有的评论.一个按钮代表一个评论。
*/

