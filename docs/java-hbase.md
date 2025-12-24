# Java 对接 HBase（示例工程）

本仓库新增了一个最小可运行的 Java/HBase 对接示例：`java-hbase-demo/`。

## 目录说明

- `java-hbase-demo/pom.xml`: Maven 依赖与可执行 fat-jar 打包
- `java-hbase-demo/src/main/java/com/example/hbase/HBaseClientDemo.java`: 连接/建表/put/get/scan 示例
- `java-hbase-demo/src/main/resources/hbase-site.xml`: 本地模板（生产建议直接用集群配置替换）

## 运行方式

在仓库根目录执行：

```bash
mvn -f java-hbase-demo/pom.xml -q package
java -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar
```

默认会：

- 自动创建表 `demo:users`（不存在才创建）
- 写入一条数据：row=`u1`，列 `cf:name`=`alice`
- 读取并打印该行
- 扫描并打印 `cf` 列族下的数据

### 指定表名 / 删除表

```bash
java -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar --table demo:t1
java -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar --table demo:t1 --drop
```

## 配置 HBase 连接参数

HBase Java Client 主要靠 `hbase-site.xml`（以及安全集群场景下的额外认证配置）来定位集群。

### 推荐做法：使用集群的 hbase-site.xml

把集群机器上的 `hbase-site.xml` 拷贝到本机一个目录，例如 `/etc/hbase/conf/`，然后运行时指定：

```bash
HBASE_CONF_DIR=/etc/hbase/conf \
java -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar
```

或使用 JVM 参数：

```bash
java -Dhbase.conf.dir=/etc/hbase/conf \
  -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar
```

### 快速覆盖（适合容器/开发）

用环境变量覆盖 ZooKeeper 信息：

```bash
HBASE_ZK_QUORUM=zk1,zk2,zk3 \
HBASE_ZK_PORT=2181 \
HBASE_ZNODE_PARENT=/hbase \
java -jar java-hbase-demo/target/java-hbase-demo-1.0.0.jar
```

## 生产接入要点（建议你核对）

- **版本匹配**：HBase Client 版本建议和集群主版本一致（至少同一大版本线，例如 2.x 对 2.x）。
- **网络连通**：客户端需要能访问 ZooKeeper（以及 RegionServer 的 RPC 端口，默认 16020）。
- **配置来源**：优先使用集群的 `hbase-site.xml`，避免自己手写漏项（尤其是发行版自定义的 `zookeeper.znode.parent`）。

## Kerberos（安全集群）提示

安全集群通常还需要：

- 在 `hbase-site.xml` / `core-site.xml` 中开启 `hadoop.security.authentication=kerberos`
- 准备 `krb5.conf`、`keytab`，并在代码中调用 Hadoop UGI 登录（`UserGroupInformation.loginUserFromKeytab(...)`）

不同发行版与集群策略差异很大，这部分我没有在示例里硬编码；你如果把你们集群的认证方式（keytab 还是 ticket、principal 格式、是否需要 `core-site.xml`）告诉我，我可以把 Kerberos 登录也补成一份可运行的版本。

