#!/bin/bash
# OSS批量上传脚本
# 使用方法: ./upload_batch.sh [文件或目录路径]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Python和依赖
check_requirements() {
    print_info "检查环境要求..."
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 未安装"
        exit 1
    fi
    
    if [ ! -f "oss_uploader.py" ]; then
        print_error "oss_uploader.py 文件不存在"
        exit 1
    fi
    
    if [ ! -f "oss_config.json" ]; then
        print_error "oss_config.json 配置文件不存在"
        print_info "请先运行: python3 quick_start.py"
        exit 1
    fi
    
    print_success "环境检查通过"
}

# 检查配置文件
check_config() {
    print_info "检查配置文件..."
    
    if ! python3 -c "
import json
with open('oss_config.json', 'r') as f:
    config = json.load(f)
required = ['access_key_id', 'access_key_secret', 'endpoint', 'bucket_name']
missing = [k for k in required if not config.get(k) or config[k] == f'your_{k}']
if missing:
    print(f'配置缺失: {missing}')
    exit(1)
" 2>/dev/null; then
        print_error "配置文件不完整，请先配置 oss_config.json"
        print_info "运行: python3 quick_start.py"
        exit 1
    fi
    
    print_success "配置文件检查通过"
}

# 显示帮助信息
show_help() {
    echo "OSS批量文件上传工具"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项] [文件或目录]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -f, --files         上传指定文件"
    echo "  -d, --directory     上传目录"
    echo "  -p, --prefix        自定义上传前缀"
    echo "  -e, --extensions    指定文件扩展名"
    echo "  -c, --config        指定配置文件"
    echo ""
    echo "示例:"
    echo "  $0 -f file1.txt file2.jpg"
    echo "  $0 -d /path/to/directory"
    echo "  $0 -d /path/to/directory -e .txt .json"
    echo "  $0 -f file1.txt -p 'documents/2024/'"
    echo ""
    echo "直接使用:"
    echo "  python3 oss_uploader.py --help"
}

# 主函数
main() {
    # 检查参数
    if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    # 检查环境
    check_requirements
    check_config
    
    # 构建命令
    cmd="python3 oss_uploader.py"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--files)
                shift
                files=()
                while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
                    files+=("$1")
                    shift
                done
                if [ ${#files[@]} -gt 0 ]; then
                    cmd="$cmd --files ${files[*]}"
                fi
                ;;
            -d|--directory)
                shift
                if [ $# -gt 0 ]; then
                    cmd="$cmd --directory $1"
                    shift
                fi
                ;;
            -p|--prefix)
                shift
                if [ $# -gt 0 ]; then
                    cmd="$cmd --prefix '$1'"
                    shift
                fi
                ;;
            -e|--extensions)
                shift
                extensions=()
                while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
                    extensions+=("$1")
                    shift
                done
                if [ ${#extensions[@]} -gt 0 ]; then
                    cmd="$cmd --extensions ${extensions[*]}"
                fi
                ;;
            -c|--config)
                shift
                if [ $# -gt 0 ]; then
                    cmd="$cmd --config $1"
                    shift
                fi
                ;;
            *)
                # 如果没有指定选项，假设是文件或目录
                if [ -f "$1" ] || [ -d "$1" ]; then
                    if [ -f "$1" ]; then
                        cmd="$cmd --files '$1'"
                    else
                        cmd="$cmd --directory '$1'"
                    fi
                else
                    print_error "无效的参数: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 执行上传
    print_info "执行命令: $cmd"
    echo ""
    
    if eval $cmd; then
        print_success "上传完成!"
    else
        print_error "上传失败!"
        exit 1
    fi
}

# 运行主函数
main "$@"