import java.util.*;
import java.util.stream.Collectors;

public class JavaLambdaSum {
    
    // 简单的Person类用于演示对象属性求和
    static class Person {
        private String name;
        private int age;
        private double salary;
        
        public Person(String name, int age, double salary) {
            this.name = name;
            this.age = age;
            this.salary = salary;
        }
        
        public String getName() { return name; }
        public int getAge() { return age; }
        public double getSalary() { return salary; }
        
        @Override
        public String toString() {
            return String.format("Person{name='%s', age=%d, salary=%.2f}", name, age, salary);
        }
    }
    
    public static void main(String[] args) {
        System.out.println("=== Java 8 Lambda 求和示例 ===\n");
        
        // 1. 整数列表求和
        System.out.println("1. 整数列表求和:");
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        System.out.println("原始列表: " + numbers);
        
        // 使用 reduce() 方法
        int sum1 = numbers.stream()
                         .reduce(0, Integer::sum);
        System.out.println("使用 reduce(): " + sum1);
        
        // 使用 mapToInt() 和 sum()
        int sum2 = numbers.stream()
                         .mapToInt(Integer::intValue)
                         .sum();
        System.out.println("使用 mapToInt().sum(): " + sum2);
        
        // 使用 reduce() 和 lambda 表达式
        int sum3 = numbers.stream()
                         .reduce(0, (a, b) -> a + b);
        System.out.println("使用 reduce() lambda: " + sum3);
        
        System.out.println();
        
        // 2. 双精度列表求和
        System.out.println("2. 双精度列表求和:");
        List<Double> doubles = Arrays.asList(1.5, 2.3, 3.7, 4.2, 5.8);
        System.out.println("原始列表: " + doubles);
        
        double doubleSum = doubles.stream()
                                 .reduce(0.0, Double::sum);
        System.out.println("求和结果: " + doubleSum);
        
        // 使用 mapToDouble() 和 sum()
        double doubleSum2 = doubles.stream()
                                  .mapToDouble(Double::doubleValue)
                                  .sum();
        System.out.println("使用 mapToDouble().sum(): " + doubleSum2);
        
        System.out.println();
        
        // 3. 对象属性求和
        System.out.println("3. 对象属性求和:");
        List<Person> people = Arrays.asList(
            new Person("张三", 25, 5000.0),
            new Person("李四", 30, 6000.0),
            new Person("王五", 28, 5500.0),
            new Person("赵六", 35, 7000.0)
        );
        
        System.out.println("员工列表:");
        people.forEach(System.out::println);
        
        // 年龄总和
        int totalAge = people.stream()
                           .mapToInt(Person::getAge)
                           .sum();
        System.out.println("年龄总和: " + totalAge);
        
        // 工资总和
        double totalSalary = people.stream()
                                  .mapToDouble(Person::getSalary)
                                  .sum();
        System.out.println("工资总和: " + totalSalary);
        
        // 使用 reduce 计算工资总和
        double totalSalary2 = people.stream()
                                   .map(Person::getSalary)
                                   .reduce(0.0, Double::sum);
        System.out.println("工资总和 (使用reduce): " + totalSalary2);
        
        System.out.println();
        
        // 4. 条件求和
        System.out.println("4. 条件求和:");
        
        // 只计算偶数的和
        int evenSum = numbers.stream()
                            .filter(n -> n % 2 == 0)
                            .mapToInt(Integer::intValue)
                            .sum();
        System.out.println("偶数和: " + evenSum);
        
        // 只计算年龄大于等于30的员工工资总和
        double seniorSalarySum = people.stream()
                                     .filter(p -> p.getAge() >= 30)
                                     .mapToDouble(Person::getSalary)
                                     .sum();
        System.out.println("年龄>=30员工工资总和: " + seniorSalarySum);
        
        System.out.println();
        
        // 5. 分组求和
        System.out.println("5. 分组求和:");
        
        // 按年龄段分组求工资和
        Map<String, Double> salaryByAgeGroup = people.stream()
            .collect(Collectors.groupingBy(
                p -> p.getAge() < 30 ? "年轻组" : "成熟组",
                Collectors.summingDouble(Person::getSalary)
            ));
        
        System.out.println("按年龄段分组的工资总和:");
        salaryByAgeGroup.forEach((group, sum) -> 
            System.out.println(group + ": " + sum));
        
        System.out.println();
        
        // 6. 空列表处理
        System.out.println("6. 空列表处理:");
        List<Integer> emptyList = new ArrayList<>();
        int emptySum = emptyList.stream()
                               .mapToInt(Integer::intValue)
                               .sum();
        System.out.println("空列表求和: " + emptySum);
        
        // 使用 Optional 处理可能为空的结果
        OptionalInt maxValue = numbers.stream()
                                     .mapToInt(Integer::intValue)
                                     .max();
        System.out.println("最大值: " + (maxValue.isPresent() ? maxValue.getAsInt() : "无"));
    }
}