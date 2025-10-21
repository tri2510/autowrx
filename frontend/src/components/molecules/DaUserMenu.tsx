// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { User } from '@/types/user.type.ts'
import { TbLogout, TbUser } from 'react-icons/tb'
import { BsBox } from "react-icons/bs";
import { DaButton } from '../atoms/DaButton'
import useAuthStore from '@/stores/authStore'
import DaMenu from '../atoms/DaMenu'
import { DaText } from '../atoms/DaText'
import { Link } from 'react-router-dom'

interface DaUserDropdownProps {
  user: User
}

const DaUserMenu = ({ user }: DaUserDropdownProps) => {
  const logOut = useAuthStore((state) => state.logOut)

  const handleLogout = async () => {
    try {
      logOut()
    } catch (error) {
      console.error('Logout failed')
    }
  }

  return (
    <div className="flex items-center justify-center ml-2">
      <DaMenu
        trigger={
          <DaButton variant="plain" className="h-10 w-10 !p-2">
            <img
              src={user.image_file || '/imgs/profile.png'}
              alt="User profile"
              className="h-full w-full object-cover rounded-full cursor-pointer"
              onError={(e) => {
                e.currentTarget.src = '/imgs/profile.png';
              }}
            />
          </DaButton>
        }
      >
        <Link
          to="/profile"
          className="flex px-4 py-2 da-menu-item items-center"
        >
          <DaText variant="small-medium" className="flex items-center gap-2 ">
            <TbUser /> User Profile
          </DaText>
        </Link>
        <Link
          to="/my-assets"
          className="flex px-4 py-2 da-menu-item items-center"
        >
          <DaText variant="small-medium" className="flex items-center gap-2 ">
            <BsBox /> My Assets
          </DaText>
        </Link>
        <div
          onClick={handleLogout}
          className="px-4 py-2 da-menu-item flex items-center gap-2"
        >
          <DaText variant="small-medium" className="flex items-center gap-2">
            <TbLogout /> Logout
          </DaText>
        </div>
      </DaMenu>
    </div>
  )
}

export default DaUserMenu
