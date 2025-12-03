"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Rate,
  Input,
  InputNumber,
  Space,
  Progress,
  Divider,
  Modal,
} from "antd";
import {
  FireOutlined,
  InfoCircleOutlined,
  HeartOutlined,
  StarOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { restaurantStore, cartStore, httpService } from "@/stores";
import { observer } from "mobx-react-lite";
import AppHeader from "@/components/Header";
import styles from "./page.module.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const RestaurantPage = observer(() => {
  const params = useParams();
  const router = useRouter();
  const [menu, setMenu] = useState<Array<{
    id: number;
    name: string;
    description?: string;
    price: number;
    discountPrice?: number;
    weight?: string;
    imageUrl?: string[];
    restaurantCategory?: { id: number; name: string; orderIndex: number } | null;
    isAvailable: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartInitialized, setCartInitialized] = useState(false);
  const [clearCartModalVisible, setClearCartModalVisible] = useState(false);
  const [pendingDish, setPendingDish] = useState<typeof menu[0] | null>(null);
  const [existingRestaurantName, setExistingRestaurantName] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      await restaurantStore.fetchRestaurant(Number(params.id));
      const data = await httpService.get<typeof menu>(`/api/restaurants/${params.id}/menu`);
      setMenu(data);
      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (!cartInitialized) {
      cartStore.fetchCart();
      setCartInitialized(true);
    }
  }, [cartInitialized]);

  const handleAddToCart = async (dish: typeof menu[0]) => {
    const result = await cartStore.addItem(
      dish.id,
      Number(params.id),
      1
    );

    if (!result.success && result.conflict) {
      // Показываем модальное окно для подтверждения очистки корзины
      setExistingRestaurantName(result.existingRestaurant?.name || null);
      setPendingDish(dish);
      setClearCartModalVisible(true);
    }
  };

  const handleConfirmClearCart = async () => {
    if (pendingDish) {
      const result = await cartStore.clearCartAndAddItem(
        pendingDish.id,
        Number(params.id),
        1
      );
      if (result.success) {
        setClearCartModalVisible(false);
        setPendingDish(null);
        setExistingRestaurantName(null);
      }
    }
  };

  const handleCancelClearCart = () => {
    setClearCartModalVisible(false);
    setPendingDish(null);
    setExistingRestaurantName(null);
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(itemId);
    } else {
      cartStore.updateQuantity(itemId, quantity);
    }
  };

  const categories = Array.from(
    new Map(
      menu
        .map((dish) => dish.restaurantCategory)
        .filter((cat): cat is NonNullable<typeof cat> => cat !== null)
        .map((cat) => [cat.id, cat])
    ).values()
  ).sort((a, b) => a.orderIndex - b.orderIndex);

  const filteredMenu = menu.filter((dish) => {
    const matchesCategory = !selectedCategoryId || dish.restaurantCategory?.id === selectedCategoryId;
    const matchesSearch = !searchQuery || 
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && dish.isAvailable;
  });

  const currentCategory = categories.find((cat) => cat.id === selectedCategoryId);

  if (loading || !restaurantStore.currentRestaurant) {
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  }

  const restaurant = restaurantStore.currentRestaurant;
  const cartItems = cartStore.items.filter((item) => item.restaurantId === Number(params.id));
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.dish?.price || 0) * item.quantity, 0);
  const minOrderAmount = restaurant.minOrderAmount ? Number(restaurant.minOrderAmount) : 0;
  const deliveryFee = restaurant.deliveryFee ? Number(restaurant.deliveryFee) : 0;
  // Используем minOrderAmount как порог для бесплатной доставки (если он больше 0)
  const freeDeliveryThreshold = minOrderAmount > 0 ? minOrderAmount : 0;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - cartTotal);
  const progressPercent = freeDeliveryThreshold > 0 
    ? Math.min(100, (cartTotal / freeDeliveryThreshold) * 100)
    : 100;

  // Форматируем время открытия (пример)
  const openingTime = "09:00";
  const isOpen = true; // Здесь должна быть логика проверки времени работы

  return (
    <Layout className={styles.layout}>
      <AppHeader />
      
      {/* Header с информацией о ресторане */}
      <div className={styles.restaurantHeader}>
        <div className={styles.restaurantHeaderLeft}>
          <FireOutlined className={styles.fireIcon} />
          <Text>
            {restaurant.name} {isOpen ? "откроется в" : "открыт"} {openingTime}
          </Text>
        </div>
        <Button 
          type="default" 
          className={styles.showOtherRestaurantsBtn}
          onClick={() => router.push("/")}
        >
          Показать другие рестораны +
        </Button>
      </div>

      <Content className={styles.content}>
        <Row gutter={0} className={styles.mainRow}>
          {/* Левая боковая панель - Категории */}
          <Col span={4} className={styles.categoriesSidebar}>
            <div className={styles.categoriesList}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`${styles.categoryItem} ${
                    selectedCategoryId === category.id ? styles.categoryItemActive : ""
                  }`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </div>
              ))}
            </div>
          </Col>

          {/* Центральная область - Меню */}
          <Col span={14} className={styles.menuArea}>
            {/* Баннер ресторана */}
            <div className={styles.restaurantBanner}>
              {restaurant.coverUrl ? (
                <img
                  src={restaurant.coverUrl}
                  alt={restaurant.name}
                  className={styles.bannerImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className={styles.bannerPlaceholder}>
                  {restaurant.logoUrl ? (
                    <img
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      className={styles.logoImage}
                    />
                  ) : (
                    <Text>Нет изображения</Text>
                  )}
                </div>
              )}
              <div className={styles.bannerOverlay}>
                <div className={styles.bannerInfo}>
                  <Title level={3} className={styles.restaurantName}>
                    {restaurant.name}
                  </Title>
                  <Space>
                    <Button
                      type="text"
                      icon={<InfoCircleOutlined />}
                      className={styles.infoButton}
                    />
                    <Button
                      type="text"
                      icon={<HeartOutlined />}
                      className={styles.favoriteButton}
                    />
                  </Space>
                </div>
                <div className={styles.bannerMeta}>
                  <Space>
                    <StarOutlined />
                    <Text>Мало оценок</Text>
                  </Space>
                  <Space>
                    <ClockCircleOutlined />
                    <Text>{restaurant.deliveryTime || 55} мин</Text>
                  </Space>
                </div>
              </div>
            </div>

            {/* Поисковая строка */}
            <Input
              placeholder="Найти"
              prefix={<SearchOutlined />}
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Заголовок категории */}
            {currentCategory && (
              <Title level={4} className={styles.categoryTitle}>
                {currentCategory.name}
              </Title>
            )}

            {/* Сетка блюд */}
            <Row gutter={[16, 16]} className={styles.dishesGrid}>
              {filteredMenu.map((dish) => {
                const cartItem = cartItems.find((item) => item.dishId === dish.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <Col span={6} key={dish.id}>
                    <Card
                      className={styles.dishCard}
                      cover={
                        dish.imageUrl && dish.imageUrl.length > 0 ? (
                          <div className={styles.dishImageContainer}>
                            <img
                              src={dish.imageUrl[0]}
                              alt={dish.name}
                              className={styles.dishImage}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            {quantity > 0 && (
                              <div className={styles.dishQuantityBadge}>
                                {quantity}
                              </div>
                            )}
                          </div>
                        ) : null
                      }
                    >
                      <div className={styles.dishContent}>
                        <Title level={5} className={styles.dishName}>
                          {dish.name}
                        </Title>
                        {dish.weight && (
                          <Text type="secondary" className={styles.dishWeight}>
                            {dish.weight}
                          </Text>
                        )}
                        <div className={styles.dishPrice}>
                          {dish.discountPrice ? (
                            <>
                              <Text delete type="secondary" style={{ marginRight: 8 }}>
                                {dish.price} ₽
                              </Text>
                              <Text strong style={{ color: "#ff4d4f" }}>
                                {dish.discountPrice} ₽
                              </Text>
                            </>
                          ) : (
                            <Text strong>{dish.price} ₽</Text>
                          )}
                        </div>
                        {quantity > 0 ? (
                          <div className={styles.quantityControls}>
                            <Button
                              icon={<MinusOutlined />}
                              onClick={() => handleQuantityChange(cartItem!.id, quantity - 1)}
                            />
                            <span className={styles.quantityValue}>{quantity}</span>
                            <Button
                              icon={<PlusOutlined />}
                              onClick={() => handleQuantityChange(cartItem!.id, quantity + 1)}
                            />
                          </div>
                        ) : (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className={styles.addButton}
                            onClick={() => handleAddToCart(dish)}
                          >
                            + {dish.discountPrice || dish.price} ₽
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>

          {/* Правая боковая панель - Корзина */}
          <Col span={6} className={styles.cartSidebar}>
            <div className={styles.cartContainer}>
              {/* Информация о доставке */}
              <div className={styles.deliveryInfo}>
                <Space>
                  <FireOutlined />
                  <Text>
                    {remainingForFreeDelivery > 0
                      ? `Доставка бесплатная от ${freeDeliveryThreshold} ₽`
                      : "Доставка бесплатная"}
                  </Text>
                </Space>
                {remainingForFreeDelivery > 0 && (
                  <Progress
                    percent={progressPercent}
                    showInfo={false}
                    strokeColor="#52c41a"
                    className={styles.deliveryProgress}
                  />
                )}
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Товары в корзине */}
              <div className={styles.cartItems}>
                {cartItems.length === 0 ? (
                  <Text type="secondary">Корзина пуста</Text>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      <img
                        src={item.dish?.imageUrl?.[0] || ""}
                        alt={item.dish?.name}
                        className={styles.cartItemImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className={styles.cartItemInfo}>
                        <Text strong className={styles.cartItemName}>
                          {item.dish?.name}
                        </Text>
                        {item.dish && (
                          <Text type="secondary" className={styles.cartItemWeight}>
                            {item.dish.weight || ""}
                          </Text>
                        )}
                        <div className={styles.cartItemPrice}>
                          <Text strong>
                            {((item.dish?.price || 0) * item.quantity).toLocaleString()} ₽
                          </Text>
                        </div>
                        <div className={styles.cartItemControls}>
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          />
                          <span className={styles.cartQuantityValue}>{item.quantity}</span>
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Опция столовых приборов */}
              <div className={styles.cutleryOption}>
                <Space>
                  <span className={styles.cutleryIcon}>🍴</span>
                  <div>
                    <Text strong>Приборы</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Никогда не будут лишними!
                    </Text>
                  </div>
                </Space>
                <div className={styles.cutleryControls}>
                  <Button size="small" icon={<MinusOutlined />} />
                  <span className={styles.cutleryQuantity}>1</span>
                  <Button size="small" icon={<PlusOutlined />} />
                </div>
                <Text className={styles.cutleryPrice}>0 ₽</Text>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Итоговая сумма и кнопка */}
              <div className={styles.cartFooter}>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      cartItems.forEach((item) => cartStore.removeItem(item.id));
                    }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    className={styles.checkoutButton}
                    onClick={() => router.push("/checkout")}
                    disabled={cartItems.length === 0}
                  >
                    Корзина {cartTotal.toLocaleString()} ₽
                  </Button>
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </Content>

      {/* Модальное окно для подтверждения очистки корзины */}
      <Modal
        title={`В корзине остались товары из «${existingRestaurantName}»`}
        open={clearCartModalVisible}
        onOk={handleConfirmClearCart}
        onCancel={handleCancelClearCart}
        okText="Хорошо"
        cancelText="Отмена"
        okButtonProps={{ style: { background: "#000", borderColor: "#000" } }}
      >
        <p>
          Чтобы добавить товары из {restaurant.name}, нам придется очистить корзину
        </p>
      </Modal>
    </Layout>
  );
});

export default RestaurantPage;
