window.onload = function () {
  let buildType = null;
  Terminal.applyAddon(attach);
  Terminal.applyAddon(fit);
  const term = new Terminal({
    useStyle: true,
    convertEol: true,
    screenKeys: true,
    cursorBlink: false,
    visualBell: true,
    colors: Terminal.xtermColors
  });
  window.term = term;
  const terminalDom = document.getElementById('terminal');
  const socket = io();

  // 对Date的扩展，将 Date 转化为指定格式的String
  // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
  // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
  // 例子：
  // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
  // (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
  Date.prototype.Format = function (fmt) { //author: meizz
    var o = {   
      "M+" : this.getMonth()+1,                 //月份
      "d+" : this.getDate(),                    //日
      "h+" : this.getHours(),                   //小时
      "m+" : this.getMinutes(),                 //分
      "s+" : this.getSeconds(),                 //秒
      "q+" : Math.floor((this.getMonth()+3)/3), //季度
      "S"  : this.getMilliseconds()             //毫秒
    };   
    if(/(y+)/.test(fmt))   
      fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
    for(var k in o)   
      if(new RegExp("("+ k +")").test(fmt))   
    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
    return fmt;   
  }

  const checkToken = () => {
    if (window.localStorage.token) {
      document.querySelector('#no-auth').style.display = 'none';
      document.querySelector('#auth').style.display = 'block';
      return true;
    } else {
      document.querySelector('#no-auth').style.display = 'block';
      document.querySelector('#auth').style.display = 'none';
      return false;
    }
  }

  const dockerInitailize = () => {
    socket.emit('pull', 'win');
    socket.emit('pull', 'linux');
    term.on('data', (data) => {
      socket.emit('cmd', data);
    })
  }

  const showLog = (path) => {
    term.clear();
    term.writeln('Loading...');
    socket.emit('log', encodeURI(path));
  }

  const getHash = () => {
    try {
      const shaObj = new jsSHA("SHA-512", "TEXT");
      shaObj.update(window.localStorage.token);
      return shaObj.getHash("HEX");
    } catch (err) {
      console.error(err);
      alert(err.toString());
    }
  }

  const checkAuth = async () => {
    try {
      const hash = getHash();
      const response = await fetch('/app/auth?token=' + hash);
      const data = await response.json();
      if (data.status === 1) {
        buildType = data.result.buildType;
        if (!buildType.includes('linux')) document.getElementById('buildLinuxBtn').style.display = 'none';
        if (!buildType.includes('win')) document.getElementById('buildWindowsBtn').style.display = 'none';
        if (!buildType.includes('mac')) document.getElementById('buildMacBtn').style.display = 'none';
      } else {
        alert(data.msg);
        window.localStorage.removeItem('token');
        window.location.reload();
        return false;
      }

      socket.on('requireAuth', (data) => {
        if (data === 'distribution') {
          socket.emit('auth', hash);
        }
      })

      socket.on('auth', (data) => {
        if (data === 'success') {
          term.clear();
          term.write('Welcome \x1B[1;3;31mElectron Distribution\x1B[0m ! \n');
        } else {
          term.clear();
          term.write('Auth fail. \n');
        }
      })

      return true;
    } catch (e) {
      console.error(e);
      alert('Network Error.');
      return false;
    }
  }

  const gitPull = () => {
    socket.emit('gitPull', '');
  }

  const buildApp = async (type) => {
    document.getElementById('table').innerHTML = '';
    term.clear();
    term.writeln('Loading...');

    try {
      const hash = getHash();
      const response = await fetch('/build/' + type + '?token=' + hash);
      const data = await response.json();
      if (data.status === 1) {
        term.clear();
        term.write('Runing yarn... \n');
        socket.emit('logs', data.result);
      } else {
        alert(data.msg);
      }
    } catch (e) {
      console.error(e);
      alert('Network Error.');
    }
  }

  const getLocalTime = (nS) => {     
    return new Date(Number(nS)).Format("yyyy-MM-dd hh:mm:ss");
  }

  const getList = async (type) => {
    try {
      const hash = getHash();
      const response = await fetch('/app/list/' + type + '?token=' + hash);
      const data = await response.json();
      if (data.status === 1) {
        if (data.result.list && data.result.list.length) {
          for (const n in data.result.list) {
            if (data.result.list[n].startDate) {
              data.result.list[n].startDate = getLocalTime(data.result.list[n].startDate)
            } else if (data.result.list[n].releaseDate) {
              data.result.list[n].releaseDate = getLocalTime(data.result.list[n].releaseDate)
            }
          }
          document.getElementById('table').innerHTML = convertJsonToTable(data.result.list);
        } else {
          document.getElementById('table').innerHTML = 'No data.';
        }
      } else {
        alert(data.msg);
      }
    } catch (e) {
      console.error(e);
      alert('Network Error.');
    }
  }

  const init = async () => {
    if (!checkToken()) return;

    if (!(await checkAuth())) return;

    window.showLog = showLog;

    socket.on('show', (data) => {
      term.write(data);
    })

    socket.on('progress', (data) => {
      term.clear();
      term.write(data);
    })

    socket.on('end', (data) => {
      term.write(data);
    })

    socket.on('err', (data) => {
      term.write(data);
    })

    term.open(terminalDom);
    term.fit();
    term.write('Verifying... Please wait ...\n');
  }

  document.querySelector('#tokenInput').onkeyup = function (e) {
    if (e && e.keyCode == 13) {
      window.localStorage.token = document.querySelector('#tokenInput').value;
      window.location.reload();
    }
  }

  document.querySelector('#logoutBtn').onclick = function () {
    window.localStorage.removeItem('token');
    window.location.reload();
  }

  document.querySelector('#listReleaseBtn').onclick = function () {
    getList('release')
  }

  document.querySelector('#listBuildBtn').onclick = function () {
    getList('build')
  }

  document.querySelector('#dockerInitBtn').onclick = function () {
    document.getElementById('table').innerHTML = '';
    term.clear();
    term.writeln('Loading...');
    dockerInitailize();
  }

  document.querySelector('#gitPullBtn').onclick = function () {
    document.getElementById('table').innerHTML = '';
    term.clear();
    term.writeln('Loading...');
    gitPull();
  }

  document.querySelector('#buildLinuxBtn').onclick = function () {
    buildApp('linux');
  }

  document.querySelector('#buildWindowsBtn').onclick = function () {
    buildApp('win');
  }

  document.querySelector('#buildMacBtn').onclick = function () {
    buildApp('mac');
  }

  init();
}