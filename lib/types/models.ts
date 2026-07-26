/**
 * 도메인 모델 타입 정의
 *
 * Supabase 공식 권장사항에 따라 profiles 테이블을 사용합니다.
 * 참고: https://supabase.com/docs/guides/auth/managing-user-data
 */

import { Database } from "@/lib/supabase/database.types";

/**
 * 사용자 데이터 모델 (profiles 테이블 기반)
 *
 * Supabase의 auth.users를 확장하는 public.profiles 테이블입니다.
 *
 * @property id - 사용자 고유 식별자 (auth.users 참조)
 * @property email - 사용자 이메일 주소
 * @property full_name - 사용자 전체 이름
 * @property username - 사용자명 (선택 사항)
 * @property avatar_url - 프로필 이미지 URL
 * @property website - 웹사이트 URL (선택 사항)
 * @property role - 사용자 권한 ('user' | 'admin')
 * @property created_at - 계정 생성 일시
 * @property updated_at - 정보 수정 일시
 */
export type User = Database["public"]["Tables"]["profiles"]["Row"];
