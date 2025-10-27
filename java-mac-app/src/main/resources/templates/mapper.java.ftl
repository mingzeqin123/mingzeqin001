package ${package.Mapper};

import ${package.Entity}.${entity};
import ${superMapperClassPackage}.${superMapperClass};
<#if swagger>
import io.swagger.annotations.Api;
</#if>
import org.apache.ibatis.annotations.Mapper;

/**
 * <p>
 * ${table.comment!} Mapper 接口
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
<#if swagger>
@Api(tags = "${table.comment!}管理")
</#if>
@Mapper
public interface ${table.mapperName} extends ${superMapperClass}<${entity}> {

}