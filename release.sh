#!/bin/bash
PACKAGE_VERSION=$(grep 'version' package.json | cut -d '"' -f4)

yarn build

docker build -t wy373226722/electron-distribution:$PACKAGE_VERSION .

docker tag wy373226722/electron-distribution:$PACKAGE_VERSION registry.cn-shenzhen.aliyuncs.com/yi-ge/electron-distribution:$PACKAGE_VERSION
docker tag wy373226722/electron-distribution:$PACKAGE_VERSION registry.cn-shenzhen.aliyuncs.com/yi-ge/electron-distribution:latest
docker tag wy373226722/electron-distribution:$PACKAGE_VERSION ccr.ccs.tencentyun.com/yi-ge/electron-distribution:$PACKAGE_VERSION
docker tag wy373226722/electron-distribution:$PACKAGE_VERSION ccr.ccs.tencentyun.com/yi-ge/electron-distribution:latest
docker tag wy373226722/electron-distribution:$PACKAGE_VERSION wy373226722/electron-distribution:latest

docker push ccr.ccs.tencentyun.com/yi-ge/electron-distribution:$PACKAGE_VERSION
docker push ccr.ccs.tencentyun.com/yi-ge/electron-distribution:latest
docker push registry.cn-shenzhen.aliyuncs.com/yi-ge/electron-distribution:$PACKAGE_VERSION
docker push registry.cn-shenzhen.aliyuncs.com/yi-ge/electron-distribution:latest
docker push wy373226722/electron-distribution:$PACKAGE_VERSION
docker push wy373226722/electron-distribution:latest
