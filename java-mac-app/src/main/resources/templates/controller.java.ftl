package ${package.Controller};

<#assign serviceClass="${package.Service}.${table.serviceName}">
<#assign serviceImplClass="${package.ServiceImpl}.${table.serviceImplName}">
import ${package.Entity}.${entity};
import ${serviceClass};
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.core.metadata.IPage;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
<#if swagger>
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
</#if>
<#if restControllerStyle>
import org.springframework.web.bind.annotation.RestController;
<#else>
import org.springframework.stereotype.Controller;
</#if>
<#if superControllerClassPackage??>
import ${superControllerClassPackage}.${superControllerClass};
</#if>

import java.util.List;

/**
 * <p>
 * ${table.comment!} 前端控制器
 * </p>
 *
 * @author ${author}
 * @since ${date}
 */
<#if swagger>
@Api(tags = "${table.comment!}管理")
</#if>
<#if restControllerStyle>
@RestController
<#else>
@Controller
</#if>
@RequestMapping("<#if package.ModuleName??>/${package.ModuleName}</#if>/<#if controllerMappingHyphenStyle??>${controllerMappingHyphen}<#else>${table.entityPath}</#if>")
<#if superControllerClass??>
public class ${table.controllerName} extends ${superControllerClass} {
<#else>
public class ${table.controllerName} {
</#if>

    @Autowired
    private ${table.serviceName} ${table.serviceName?uncap_first};

    /**
     * 分页查询
     */
    <#if swagger>
    @ApiOperation(value = "分页查询${table.comment!}")
    </#if>
    @GetMapping("/page")
    public IPage<${entity}> page(
            <#if swagger>@ApiParam(value = "页码", defaultValue = "1")</#if> @RequestParam(defaultValue = "1") Integer current,
            <#if swagger>@ApiParam(value = "每页数量", defaultValue = "10")</#if> @RequestParam(defaultValue = "10") Integer size,
            <#if swagger>@ApiParam(value = "查询条件")</#if> ${entity} ${entity?uncap_first}) {
        Page<${entity}> page = new Page<>(current, size);
        QueryWrapper<${entity}> queryWrapper = new QueryWrapper<>();
        // 这里可以添加查询条件
        return ${table.serviceName?uncap_first}.page(page, queryWrapper);
    }

    /**
     * 根据ID查询
     */
    <#if swagger>
    @ApiOperation(value = "根据ID查询${table.comment!}")
    </#if>
    @GetMapping("/{id}")
    public ${entity} getById(<#if swagger>@ApiParam(value = "ID")</#if> @PathVariable("id") Long id) {
        return ${table.serviceName?uncap_first}.getById(id);
    }

    /**
     * 新增
     */
    <#if swagger>
    @ApiOperation(value = "新增${table.comment!}")
    </#if>
    @PostMapping
    public boolean save(<#if swagger>@ApiParam(value = "${table.comment!}对象")</#if> @RequestBody ${entity} ${entity?uncap_first}) {
        return ${table.serviceName?uncap_first}.save(${entity?uncap_first});
    }

    /**
     * 修改
     */
    <#if swagger>
    @ApiOperation(value = "修改${table.comment!}")
    </#if>
    @PutMapping
    public boolean updateById(<#if swagger>@ApiParam(value = "${table.comment!}对象")</#if> @RequestBody ${entity} ${entity?uncap_first}) {
        return ${table.serviceName?uncap_first}.updateById(${entity?uncap_first});
    }

    /**
     * 根据ID删除
     */
    <#if swagger>
    @ApiOperation(value = "根据ID删除${table.comment!}")
    </#if>
    @DeleteMapping("/{id}")
    public boolean removeById(<#if swagger>@ApiParam(value = "ID")</#if> @PathVariable("id") Long id) {
        return ${table.serviceName?uncap_first}.removeById(id);
    }

    /**
     * 批量删除
     */
    <#if swagger>
    @ApiOperation(value = "批量删除${table.comment!}")
    </#if>
    @DeleteMapping("/batch")
    public boolean removeByIds(<#if swagger>@ApiParam(value = "ID列表")</#if> @RequestBody List<Long> ids) {
        return ${table.serviceName?uncap_first}.removeByIds(ids);
    }

    /**
     * 查询所有
     */
    <#if swagger>
    @ApiOperation(value = "查询所有${table.comment!}")
    </#if>
    @GetMapping("/list")
    public List<${entity}> list() {
        return ${table.serviceName?uncap_first}.list();
    }
}