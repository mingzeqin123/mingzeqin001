package ${package.Service};

import ${package.Entity}.${entity};
import ${superServiceClassPackage}.${superServiceClass};
<#if swagger>
import io.swagger.annotations.Api;
</#if>

/**
 * <p>
 * ${table.comment!} 服务类
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
<#if swagger>
@Api(tags = "${table.comment!}管理")
</#if>
public interface ${table.serviceName} extends ${superServiceClass}<${entity}> {

}