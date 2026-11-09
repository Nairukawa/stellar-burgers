import React, { FC } from 'react';
import { Link, NavLink, useMatch } from 'react-router-dom';
import clsx from 'clsx';
import styles from './app-header.module.css';
import { TAppHeaderUIProps } from './type';
import {
  BurgerIcon,
  ListIcon,
  Logo,
  ProfileIcon
} from '@zlden/react-developer-burger-ui-components';

export const AppHeaderUI: FC<TAppHeaderUIProps> = ({ userName }) => {
  const isIngredientDetails = Boolean(useMatch('/ingredients/:id'));

  return (
    <header className={styles.header}>
      <nav className={clsx(styles.menu, 'p-4')}>
        <div className={styles.menu_part_left}>
          <NavLink
            to='/'
            end
            className={({ isActive }) =>
              clsx(styles.link, {
                [styles.link_active]: isActive || isIngredientDetails
              })
            }
          >
            {({ isActive }) => (
              <>
                <BurgerIcon
                  type={
                    isActive || isIngredientDetails ? 'primary' : 'secondary'
                  }
                />
                <p className='text text_type_main-default ml-2 mr-10'>
                  Конструктор
                </p>
              </>
            )}
          </NavLink>
          <NavLink
            to='/feed'
            className={({ isActive }) =>
              clsx(styles.link, { [styles.link_active]: isActive })
            }
          >
            {({ isActive }) => (
              <>
                <ListIcon type={isActive ? 'primary' : 'secondary'} />
                <p className='text text_type_main-default ml-2'>
                  Лента заказов
                </p>
              </>
            )}
          </NavLink>
        </div>
        <Link to='/' className={styles.logo} aria-label='На главную'>
          <Logo className='' />
        </Link>
        <NavLink
          to='/profile'
          className={({ isActive }) =>
            clsx(styles.link, styles.link_position_last, {
              [styles.link_active]: isActive
            })
          }
        >
          {({ isActive }) => (
            <>
              <ProfileIcon type={isActive ? 'primary' : 'secondary'} />
              <p className='text text_type_main-default ml-2'>
                {userName || 'Личный кабинет'}
              </p>
            </>
          )}
        </NavLink>
      </nav>
    </header>
  );
};
