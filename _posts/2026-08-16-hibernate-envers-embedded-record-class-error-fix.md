---
title: "Hibernate Envers에서 Embedded Record Class 이슈 해결하기 (HHH-18691)"
date: 2026-08-16 14:23:00 +0900
categories: [Hibernate ORM, Hibernate Envers, Java, OSS]
---

# Hibernate Envers란?
[Hibernate Envers](https://hibernate.org/orm/envers/)는 Hibernate ORM의 Extension으로서, Hibernate ORM을 통해 Entity의 Insert / Update / Delete가 발생하면 자동으로 별도 테이블에 Revision을 남기는 역할을 한다.

Spring Data JPA에서의 기본 사용 구현체가 Hibernate이기 때문에, Spring Data JPA를 쓰고 있다면 빠르게 DB 변경 내역 감사를 시스템에 통합하기 용이하다.

내가 속한 팀에서도 같은 이유로 Envers를 사용하고 있다.

# 작업 계기
이 이슈는 내가 직접적으로 겪어서 해결하게 된 것은 아니고, [추후에 따로 다룰 이슈](https://hibernate.atlassian.net/browse/HHH-19861)를 수정하는 PR을 제출하고 나서, 추가로 Hibernate 포럼을 살펴보다 발견한 버그였다.

우리는 이 당시에는 해당 이슈처럼 사용하는 경우가 없었어서 이 이슈를 겪진 않았지만, Envers 자체가 활발한 수정이 이뤄지지 않고 있어서인지 이 이슈를 해결했던 25년 말 기준으로도 거의 1년이 넘어가는데도 수정되지 않았던 것으로 보였다.

어차피 Hibernate Envers 코드를 이미 살펴보았으니, 이 이슈도 한 번 수정해보면 좋겠다 싶어서 들여다보게 되었다.

# 문제 상황
이 이슈가 처음 제기된 [Hibernate Discourse 글](https://discourse.hibernate.org/t/envers-does-not-support-records/10397)을 보면, Entity 내에서 [Record](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Record.html)를 사용한 Type을 가진 Field에 `@Embedded`를 사용하면 Envers에서 `AuditException`이 발생하고, 내부적으로는 Record Class가 Argument가 없는 기본 Constructor가 없어 `PropertyNotFoundException`이 발생하고 있었다.

# 해결 과정

## 이슈 재현
우선은 해당 이슈를 제보한 분이 작성하셨던 [Jira 티켓](https://hibernate.atlassian.net/browse/HHH-18691)에 있는 테스트 코드를 간단하게 수정 후 실행해보았다.
- 당시 테스트했던 코드는 이후 최종 테스트 코드로 다시 작성하는 과정에서 유실되어 일부만 남아있다... 

```java
static class TestEmbeddedClass {
		public TestEmbeddedClass() {}
		public TestEmbeddedClass(String foo, String bar) {
			this.foo = foo;
			this.bar = bar;
		}

		private String foo;
		private String bar;

		public String getFoo() {
			return foo;
		}

		public String getBar() {
			return bar;
		}

		public void setFoo(String foo) {
			this.foo = foo;
		}
	}

	@Entity
	@Audited
	static class WithRecord {
		@Id
		private Integer id;

		@Embedded
		private TestRecord testRecord;

		public Integer getId() {
			return id;
		}

		static WithRecord of(int id, String foo, String bar) {
			WithRecord withRecord = new WithRecord();

			withRecord.id = id;
			withRecord.testRecord = new TestRecord(foo, bar);
			return withRecord;
		}
	}
```

이렇게 작성하고 실행하니, 실제 해당 에러를 재현해낼 수 있었다.

```
org.hibernate.PropertyNotFoundException: Object class [org.hibernate.envers.test.integration.data.RecordFieldEntityTest$TestRecord] must declare a default (no-argument) constructor
org.hibernate.envers.exception.AuditException: org.hibernate.PropertyNotFoundException: Object class [org.hibernate.envers.test.integration.data.RecordFieldEntityTest$TestRecord] must declare a default (no-argument) constructor
	at org.hibernate.envers.internal.entities.mapper.ComponentPropertyMapper.mapToEntityFromMap(ComponentPropertyMapper.java:178)
	at org.hibernate.envers.internal.entities.mapper.MultiPropertyMapper.mapToEntityFromMap(MultiPropertyMapper.java:193)
	at org.hibernate.envers.internal.entities.EntityInstantiator.createInstanceFromVersionsEntity(EntityInstantiator.java:86)
	at org.hibernate.envers.internal.entities.EntityInstantiator.addInstancesFromVersionsEntities(EntityInstantiator.java:149)
	at org.hibernate.envers.query.internal.impl.AbstractAuditQuery.applyProjections(AbstractAuditQuery.java:350)
	at org.hibernate.envers.query.internal.impl.EntitiesAtRevisionQuery.list(EntitiesAtRevisionQuery.java:137)
	at org.hibernate.envers.query.internal.impl.AbstractAuditQuery.getSingleResult(AbstractAuditQuery.java:117)
	at org.hibernate.envers.internal.reader.AuditReaderImpl.find(AuditReaderImpl.java:121)
	at org.hibernate.envers.internal.reader.AuditReaderImpl.find(AuditReaderImpl.java:94)
	at org.hibernate.envers.internal.reader.AuditReaderImpl.find(AuditReaderImpl.java:88)
	at org.hibernate.envers.test.integration.data.RecordFieldEntityTest.testLoadRecordData(RecordFieldEntityTest.java:132)
Caused by: org.hibernate.PropertyNotFoundException: Object class [org.hibernate.envers.test.integration.data.RecordFieldEntityTest$TestRecord] must declare a default (no-argument) constructor
	at org.hibernate.internal.util.ReflectHelper.getDefaultConstructor(ReflectHelper.java:306)
	at org.hibernate.envers.internal.entities.mapper.ComponentPropertyMapper.mapToEntityFromMap(ComponentPropertyMapper.java:162)
	... 10 more
	
Object class [org.hibernate.envers.test.integration.data.RecordFieldEntityTest$TestRecord] must declare a default (no-argument) constructor
org.hibernate.PropertyNotFoundException: Object class [org.hibernate.envers.test.integration.data.RecordFieldEntityTest$TestRecord] must declare a default (no-argument) constructor
	at app//org.hibernate.internal.util.ReflectHelper.getDefaultConstructor(ReflectHelper.java:306)
	at app//org.hibernate.envers.internal.entities.mapper.ComponentPropertyMapper.mapToEntityFromMap(ComponentPropertyMapper.java:162)
	at app//org.hibernate.envers.internal.entities.mapper.MultiPropertyMapper.mapToEntityFromMap(MultiPropertyMapper.java:193)
	at app//org.hibernate.envers.internal.entities.EntityInstantiator.createInstanceFromVersionsEntity(EntityInstantiator.java:86)
	at app//org.hibernate.envers.internal.entities.EntityInstantiator.addInstancesFromVersionsEntities(EntityInstantiator.java:149)
	at app//org.hibernate.envers.query.internal.impl.AbstractAuditQuery.applyProjections(AbstractAuditQuery.java:350)
	at app//org.hibernate.envers.query.internal.impl.EntitiesAtRevisionQuery.list(EntitiesAtRevisionQuery.java:137)
	at app//org.hibernate.envers.query.internal.impl.AbstractAuditQuery.getSingleResult(AbstractAuditQuery.java:117)
	at app//org.hibernate.envers.internal.reader.AuditReaderImpl.find(AuditReaderImpl.java:121)
	at app//org.hibernate.envers.internal.reader.AuditReaderImpl.find(AuditReaderImpl.java:94)
	at app//org.hibernate.envers.internal.reader.AuditReaderImpl.find(AuditReaderImpl.java:88)
	at app//org.hibernate.envers.test.integration.data.RecordFieldEntityTest.testLoadRecordData(RecordFieldEntityTest.java:132)
```

## 이슈 추적
위 Stack Trace를 보고 의심되는 함수를 하나씩 직접 코드에서 찾아나섰다.

### mapToEntityFromMap 확인하기
우선은 `org.hibernate.envers.internal.entities.mapper.ComponentPropertyMapper.mapToEntityFromMap`를 확인했다.
해당 Method 역할은 Map으로 Data가 오면, 그걸 Entity로 바꿔주는 역할을 하는 것으로 보였다.

여러가지 조건이 있었지만, 정확하게 어느 분기에 빠지는지 확인하기 위해 Debug로 실행해보니 아래처럼 볼 수 있었다.

![mapToEntityFromMap Debug]({{site.baseurl | prepend: site.url}}/assets/posts/2026-08-16-hibernate-envers-embedded-record-class-error-fix/envers-debug-map-to-entity-from-map.png)

실제 코드를 기준으로 봤을 때, 상단에 있는 여러 분기에는 딱히 걸리는 부분이 없었고 최종 else로 빠져서 실행되고 있었다.

그 else 분기가 바로 `getDefaultConstructor`를 사용하여 해당 Field의 기본 Constructor를 호출하고 있었다!

```java
				else {
					final Object subObj;
					if ( embeddableInstantiator != null ) {
						final Object[] values = new Object[delegate.properties.size()];
						int i = 0;
						for ( Map.Entry<PropertyData, PropertyMapper> entry : delegate.properties.entrySet() ) {
							values[i] = entry.getValue().mapToEntityFromMap(
									enversService,
									data,
									primaryKey,
									versionsReader,
									revision
							);
							i++;
						}
						subObj = embeddableInstantiator.instantiate( () -> values );
					}
					else {
						subObj = ReflectHelper.getDefaultConstructor( componentClass ).newInstance();
						delegate.mapToEntityFromMap(
								enversService,
								subObj,
								data,
								primaryKey,
								versionsReader,
								revision
						);
					}
					// set the component
					setter.set( obj, subObj );
				}
```

그런데, 본래 `@Embedded`인 경우에는 else로 빠지는 것이 아닌 `embeddableInstantiator != null` 라는 조건을 만족해서 Embedded를 위한 분기를 타야하는 것 같았다.

Breakpoint를 걸어서 확인해보니, 실제로 해당 분기가 아닌 최종 else로 넘어가서 해당 오류가 나는 것까지 확인하였다.

그렇다면 `embeddableInstantiator`는 어떻게 할당되는 것인지 확인해봐야 했다.

### `embeddableInstantiator`는 무엇일까?
`ComponentPropertyMapper` 클래스의 속성 중 하나로, `EmbeddableInstantiator` 타입이고, 이는 Hibernate ORM Core에 해당하는 코드였다. Embeddable 속성의 Object를 초기화할 때 사용하는 용도인 것 같다.

우선 `EmbeddableInstantiator` 자체는 Interface여서, 이걸 만드는 방법을 찾아야 했다.

그래서 `ComponentPropertyMapper`의 생성자로 저 `instantiator`를 받기에 해당 생성자를 호출하는 곳을 찾아보니 `MultiPropertyMapper`라는 클래스에서 아래처럼 처리되고 있었다.

```java
	@Override
	public CompositeMapperBuilder addComponent(
			PropertyData propertyData,
			Class componentClass, EmbeddableInstantiator instantiator) {
		if ( properties.get( propertyData ) != null ) {
			// This is needed for second pass to work properly in the components mapper
			return (CompositeMapperBuilder) properties.get( propertyData );
		}

		final ComponentPropertyMapper componentMapperBuilder = new ComponentPropertyMapper(
				propertyData,
				componentClass,
				instantiator
		);
		addComposite( propertyData, componentMapperBuilder );

		return componentMapperBuilder;
	}
```

여기서도 다른 곳에서 받은 것을 그대로 사용하고 있는 구조였다. 그래서 다음은 `addComponent`를 쓰는 곳을 찾아보았다.

대부분 내부에서 다른 곳에서 받은 `instantiator`를 바로 넘기는 구조였지만 `ComponentMetadataGenerator`라는 클래스에서의 `addComponent`에서 `propComponent`의 여러 조건에 따라 `instantiator`를 직접 만드는 것을 볼 수 있었다.

```java
		final EmbeddableInstantiator instantiator;
		if ( propComponent.getCustomInstantiator() != null ) {
			if ( !getMetadataBuildingContext().getBuildingOptions().isAllowExtensionsInCdi() ) {
				instantiator = FallbackBeanInstanceProducer.INSTANCE.produceBeanInstance( propComponent.getCustomInstantiator() );
			}
			else {
				instantiator =
						getMetadataBuildingContext().getBootstrapContext().getManagedBeanRegistry()
								.getBean( propComponent.getCustomInstantiator() )
								.getBeanInstance();
			}
		}
		else if ( propComponent.getTypeName() != null ) {
			final Class<CompositeUserType<?>> userTypeClass = getMetadataBuildingContext().getBootstrapContext()
					.getClassLoaderAccess()
					.classForName( propComponent.getTypeName() );
			if ( !getMetadataBuildingContext().getBuildingOptions().isAllowExtensionsInCdi() ) {
				final CompositeUserType<?> compositeUserType = FallbackBeanInstanceProducer.INSTANCE.produceBeanInstance( userTypeClass );
				//noinspection rawtypes
				instantiator = new EmbeddableCompositeUserTypeInstantiator( (CompositeUserType) compositeUserType );
			}
			else {
				final CompositeUserType<Object> compositeUserType = (CompositeUserType<Object>)
						getMetadataBuildingContext().getBootstrapContext().getManagedBeanRegistry()
								.getBean( userTypeClass )
								.getBeanInstance();
				instantiator = new EmbeddableCompositeUserTypeInstantiator( compositeUserType );
			}
		}
		else if ( propComponent.getInstantiator() != null ) {
			instantiator = EmbeddableInstantiatorPojoIndirecting.of(
					propComponent.getPropertyNames(),
					propComponent.getInstantiator(),
					propComponent.getInstantiatorPropertyNames()
			);
		}
		else {
			instantiator = null;
		}
```

여기서 최종적으로 현재 Record Class는 맨 아래 `instantiator = null;` 줄에 도달하는 것을 확인할 수 있었다. 

그렇기에 `embeddableInstantiator != null`를 만족하지 못하니, 기본 생성자를 찾아가게 되어 오류가 발생하는 것이었다.

그렇다면 어떻게 이걸 null이 아니게 만들어줄 수 있을까.. 하고 분기 처리 대상 엔티티인 `propComponent`를 살펴보았다.

### `EmbeddableInstantiator`를 Record를 위해 사용하는 곳을 찾기

`propComponent`는 Hibernate ORM Core에서의 `Component` Class였다. 주석을 살펴보니 `Embeddedable` Class인 경우 Mapping을 하기 위해 쓰는 것 같았다.

그러다가 문득 `EmbeddableInstantiator`가 Hibernate ORM의 Core 로직이라면, Record Class 자체도 나온지 시간이 꽤 지났으니 이를 지원하기 위해 내부에서는 처리 로직이 존재하지 않을까? 라는 생각이 들었다.

그래서 일단 `EmbeddableInstantiator`를 실제로 구현하는 구현체들을 냅다 다 뒤져보았더니, `ManagedTypeRepresentationResolverStandard` 라는 Class의 `getCustomInstantiator` Method에서 `ReflectHelper`에 `isRecord` 라는 Method로 Record 타입인지 검증하고, `Component`에 `sortProperties`가 존재하는지에 따라 `EmbeddableInstantiatorRecordStandard` 혹은 `EmbeddableInstantiatorRecordIndirecting`를 넘겨 Record에 대한 `EmbeddableInstantiator`를 만들어주는 것을 확인할 수 있었다!

아래 코드는 실제 `getCustomInstantiator` Method 내부이다.
- `bootDescriptor`는 `Component` 타입이었다.

```java
		else if ( bootDescriptor.getComponentClassName() != null
				&& isRecord( bootDescriptor.getComponentClass() ) ) {
			if ( bootDescriptor.sortProperties() == null ) {
				return new EmbeddableInstantiatorRecordStandard( bootDescriptor.getComponentClass() );
			}
			else {
				return EmbeddableInstantiatorRecordIndirecting.of(
						bootDescriptor.getComponentClass(),
						bootDescriptor.getPropertyNames()
				);
			}
		}
```

이렇게 되면 이제 위에서 찾았던 `ComponentMetadataGenerator`의 `addComponent`에 `Component`의 Record 검증 여부와 `sortProperties` null 체크 로직을 그대로 넣으면 해결이 되겠다고 판단했다.

# 이슈 해결
다시 `ComponentMetadataGenerator`의 `addComponent` Method로 돌아와서 코드를 천천히 다시 살펴봤다.

현재는 무조건 null로 빠지고 있기 때문에, 기존 로직을 건드리지 않으려면 `else` 직전에 `else if`로 이걸 체크하도록 해야겠다고 생각이 들었다.

그래서 기존의 `else if` - `else` 사이에 아래처럼 아까 찾았던 `getCustomInstantiator` Method에서 사용하는 것과 같이 Record 검증을 끼워넣었다.

```java
		else if ( propComponent.getInstantiator() != null ) {
			instantiator = EmbeddableInstantiatorPojoIndirecting.of(
					propComponent.getPropertyNames(),
					propComponent.getInstantiator(),
					propComponent.getInstantiatorPropertyNames()
			);
		}
		else if ( propComponent.getComponentClass() != null &&
					propComponent.getComponentClass().isRecord() ) {
			if ( propComponent.sortProperties() == null ) {
				instantiator = new EmbeddableInstantiatorRecordStandard( propComponent.getComponentClass() );
			}
			else {
				instantiator = EmbeddableInstantiatorRecordIndirecting.of(
						propComponent.getComponentClass(),
						propComponent.getPropertyNames()
				);
			}
		}
		else {
			instantiator = null;
		}
```

이 때는 `ReflectHelper`의 `isRecord`를 굳이 import하고 싶지 않아서 Java의 Class에 내장된 `isRecord()`를 써서 체크했다. 

이 글을 쓰면서 다시 한 번 확인해보니 Class 내장 `isRecord` Method는 Java 16 이상에서 쓸 수 있는거라고 해서 호환 이슈가 없나? 하고 찾아보았다.

Hibernate ORM에서 별도의 `ReflectHelper.isRecord()`가 존재하는 이유는 과거 JDK 버전에서도 호환되게 동작하기 위함인 것으로 보이는데, 해당 Method를 쓰지 않았음에도 실제로 PR 리뷰에서도 지적받진 않았었다.

짐작하기로는 어차피 Hibernate ORM의 Stable 버전이 7이고 실제 Backport도 7.x대까지만 이뤄져서 큰 문제가 되지 않았던 것 같다.

## 해결 테스트
이제 위처럼 문제되는 부분을 해결했으니, 보다 디테일하게 확인하기 위해 일반 Class와 Record로 만든 `@Embedded` Entity 2개를 만들어서 실제로 Envers의 `AuditReader`를 사용하여 값을 읽어오도록 아래 테스트 코드를 작성했다.

테스트는 아래 두 가지 Entity를 만들어서 감사 기록을 남기는 방식으로 데이터를 만들었다.
- Record Class를 `@Embedded` 로 설정한 WithRecord
- 일반 Class를 `@Embedded` 로 설정한 WithoutRecord

초기 데이터 세팅은 두 Entity를 단순하게 EntityManager를 통해 생성하고 영속화하여 감사 기록까지 남긴다.
```java
	EntityManager em = getEntityManager();

		em.getTransaction().begin();

		// Create WithRecord Entity
		WithRecord withRecord = WithRecord.of( 1, "foo", "bar" );
		em.persist( withRecord );

		// Create WithoutRecord
		WithoutRecord withoutRecord = WithoutRecord.of( 1, "foo", "bar" );
		em.persist( withoutRecord );

		em.getTransaction().commit();

		em.close();
```

이후 WithRecord에서 예상한 값대로 Record Class의 속성이 조회되는지 확인한다.
```java
	@Test
	public void testLoadRecordData() {
		AuditReader auditReader = getAuditReader();
		WithRecord recordRev = auditReader.find( WithRecord.class, 1, 1 );

		assertEquals("WithRecord.TestRecord.foo equals foo", "foo", recordRev.testRecord.foo());
		assertEquals("WithRecord.TestRecord.bar equals bar", "bar", recordRev.testRecord.bar());
	}
```

WithoutRecord도 동일 방식으로 기존 Class 방식에도 문제를 발생시키지 않는지 확인했다.
```java
	@Test
	public void testLoadWithoutRecordData() {
		AuditReader auditReader = getAuditReader();
		WithoutRecord withoutRecordRev = auditReader.find( WithoutRecord.class, 1, 1 );

		assertEquals("WithoutRecord.TestEmbeddedClass.foo equals foo", "foo", withoutRecordRev.getTestEmbeddedClass().getFoo());
		assertEquals("WithoutRecord.TestEmbeddedClass.bar equals bar", "bar", withoutRecordRev.getTestEmbeddedClass().getBar());
	}
```

실제 테스트를 코드 수정 이전, 그리고 수정 이후 둘 다 실행해보았다.

- Instantiator 코드 수정 전: 기존에 났던 에러가 그대로 발생 
![RecordFieldEntityTest Failed]({{site.baseurl | prepend: site.url}}/assets/posts/2026-08-16-hibernate-envers-embedded-record-class-error-fix/envers-test-failed.png)

- Instantiator 코드 수정 후: 기존에 났던 에러 없이 정상적으로 테스트 성공
![RecordFieldEntityTest Success]({{site.baseurl | prepend: site.url}}/assets/posts/2026-08-16-hibernate-envers-embedded-record-class-error-fix/envers-test-success.png)

# 마무리
해당 내용은 실제로 [Hibernate ORM PR #11180](https://github.com/hibernate/hibernate-orm/pull/11180)으로 Merge되어 7.1.7 및 그 이후 (7.2.0 ~)에 반영되었다. 

학생 때 오픈소스 기여를 한두 번 해보긴 했지만 이렇게 큰 프로젝트에 기여해보는 것은 처음이라서 Merge가 될 수 있을까? 생각했었는데, 실제 기여를 해보니 너무 두려워하기보단 일단 해보는 것이 중요하다고 생각이 들었다!

물론 위에 `isRecord()`처럼 하위 호환을 제대로 고려하지 못 한 케이스가 있던 건 좀 아쉽지만, 다음에 비슷한 기회가 있거나 혹은 프로젝트를 진행하면서는 조금 더 하위 호환 관련해서도 꼼꼼하게 봐야겠다는 점을 알게 되었으니 좋은 경험이 된 것 같다.

# References
- [hibernate/hibernate-orm](https://github.com/hibernate/hibernate-orm)
- [Envers does not support records?!](https://discourse.hibernate.org/t/envers-does-not-support-records/10397)
- [\[HHH-18691\] Envers cannot read revisions with records](https://hibernate.atlassian.net/browse/HHH-18691)