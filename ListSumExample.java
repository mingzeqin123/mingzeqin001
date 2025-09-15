import java.util.Arrays;
import java.util.List;
import java.util.stream.IntStream;
import java.util.stream.LongStream;
import java.util.stream.DoubleStream;

public class ListSumExample {
    public static void main(String[] args) {
        // 1. 对Integer列表求和
        List<Integer> integerList = Arrays.asList(1, 2, 3, 4, 5);
        int sum1 = integerList.stream()
                .mapToInt(Integer::intValue)
                .sum();
        System.out.println("Integer列表求和: " + sum1);
        
        // 2. 更简洁的写法 - 直接使用reduce
        int sum2 = integerList.stream()
                .reduce(0, Integer::sum);
        System.out.println("使用reduce求和: " + sum2);
        
        // 3. 对Long列表求和
        List<Long> longList = Arrays.asList(100L, 200L, 300L, 400L);
        long longSum = longList.stream()
                .mapToLong(Long::longValue)
                .sum();
        System.out.println("Long列表求和: " + longSum);
        
        // 4. 对Double列表求和
        List<Double> doubleList = Arrays.asList(1.5, 2.5, 3.5, 4.5);
        double doubleSum = doubleList.stream()
                .mapToDouble(Double::doubleValue)
                .sum();
        System.out.println("Double列表求和: " + doubleSum);
        
        // 5. 对字符串列表中的数字求和
        List<String> stringList = Arrays.asList("10", "20", "30", "40");
        int stringSum = stringList.stream()
                .mapToInt(Integer::parseInt)
                .sum();
        System.out.println("字符串列表求和: " + stringSum);
        
        // 6. 对对象列表的某个属性求和
        List<Person> personList = Arrays.asList(
                new Person("张三", 25),
                new Person("李四", 30),
                new Person("王五", 35)
        );
        int ageSum = personList.stream()
                .mapToInt(Person::getAge)
                .sum();
        System.out.println("人员年龄总和: " + ageSum);
        
        // 7. 使用Optional处理空列表
        List<Integer> emptyList = Arrays.asList();
        int emptySum = emptyList.stream()
                .mapToInt(Integer::intValue)
                .sum();
        System.out.println("空列表求和: " + emptySum);
        
        // 8. 过滤后求和
        List<Integer> mixedList = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        int evenSum = mixedList.stream()
                .filter(n -> n % 2 == 0)
                .mapToInt(Integer::intValue)
                .sum();
        System.out.println("偶数求和: " + evenSum);
    }
    
    static class Person {
        private String name;
        private int age;
        
        public Person(String name, int age) {
            this.name = name;
            this.age = age;
        }
        
        public int getAge() {
            return age;
        }
        
        public String getName() {
            return name;
        }
    }
}